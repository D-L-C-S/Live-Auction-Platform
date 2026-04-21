const stripe = require('../config/stripe');

exports.createPaymentIntent = async (amount, buyerId, auctionId) => {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    metadata: { buyerId, auctionId },
    capture_method: 'manual',
  });
};

exports.transferToSeller = async (escrow) => {
  await stripe.paymentIntents.capture(escrow.stripePaymentIntentId);
};

exports.refundEscrow = async (escrow) => {
  await stripe.paymentIntents.cancel(escrow.stripePaymentIntentId);
};
