const stripe = require('../config/stripe');
const Escrow = require('../models/Escrow');
const { cancelPaymentIntent } = require('../services/stripeService');

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  const paymentIntent = event.data.object;
  const auctionId = paymentIntent.metadata?.auctionId;

  try {
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated':
        // Customer confirmed the PaymentIntent — funds are authorized and held
        if (auctionId) {
          await Escrow.findOneAndUpdate(
            { auction: auctionId, status: { $ne: 'released' } },
            { status: 'held' }
          );
        }
        break;

      case 'payment_intent.succeeded':
        // PaymentIntent captured — funds transferred to platform
        if (auctionId) {
          await Escrow.findOneAndUpdate({ auction: auctionId }, { status: 'released' });
        }
        break;

      case 'payment_intent.payment_failed':
        // Payment attempt failed — mark refunded and cancel the intent
        if (auctionId) {
          await Escrow.findOneAndUpdate({ auction: auctionId }, { status: 'refunded' });
        }
        try {
          await cancelPaymentIntent(paymentIntent.id);
        } catch (cancelErr) {
          // Intent may already be in a non-cancellable state; log and continue
          console.error(`[webhook] Could not cancel PaymentIntent ${paymentIntent.id}:`, cancelErr.message);
        }
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err.message);
    return res.status(500).json({ message: 'Webhook handler error' });
  }

  res.json({ received: true });
};

module.exports = { stripeWebhook };
