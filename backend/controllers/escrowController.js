const Escrow = require('../models/Escrow');
const stripeService = require('../services/stripeService');

// GET /api/escrow/auction/:auctionId — winner or seller can check escrow status
const getEscrow = async (req, res, next) => {
  try {
    const escrow = await Escrow.findOne({ auction: req.params.auctionId })
      .populate('winner', 'name email')
      .populate('seller', 'name email');

    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    const userId = req.user._id;
    const isWinner = escrow.winner._id.equals(userId);
    const isSeller = escrow.seller._id.equals(userId);

    if (!isWinner && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ escrow });
  } catch (err) {
    next(err);
  }
};

// POST /api/escrow/init-payment — winner initiates Stripe PaymentIntent for their won auction
const initPayment = async (req, res, next) => {
  try {
    const { auctionId } = req.body;
    if (!auctionId) return res.status(400).json({ message: 'auctionId is required' });

    const escrow = await Escrow.findOne({ auction: auctionId }).populate('auction', 'title');
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    if (!escrow.winner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the winner can initiate payment' });
    }
    if (escrow.status !== 'pending_payment') {
      return res.status(400).json({ message: `Payment already processed (escrow is ${escrow.status})` });
    }

    // Reuse existing PI if one was already created (idempotent)
    if (escrow.stripePaymentIntentId) {
      const existing = await stripeService.retrievePaymentIntent(escrow.stripePaymentIntentId);
      if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
        return res.json({ clientSecret: existing.client_secret });
      }
    }

    const pi = await stripeService.createPaymentIntent(escrow.amount, {
      auctionId: auctionId.toString(),
      escrowId: escrow._id.toString(),
    });

    escrow.stripePaymentIntentId = pi.id;
    await escrow.save();

    res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    next(err);
  }
};

// POST /api/escrow/mark-payment-held — called by frontend after Stripe payment authorization succeeds
// Backend verifies the PI is in requires_capture state before updating escrow
const markPaymentHeld = async (req, res, next) => {
  try {
    const { auctionId, paymentIntentId } = req.body;
    if (!auctionId || !paymentIntentId) {
      return res.status(400).json({ message: 'auctionId and paymentIntentId are required' });
    }

    const escrow = await Escrow.findOne({ auction: auctionId });
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    if (!escrow.winner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (escrow.status !== 'pending_payment') {
      return res.status(400).json({ message: `Escrow is already ${escrow.status}` });
    }

    const pi = await stripeService.retrievePaymentIntent(paymentIntentId);
    if (pi.status !== 'requires_capture') {
      return res.status(400).json({ message: `Payment not authorized (status: ${pi.status})` });
    }

    escrow.stripePaymentIntentId = pi.id;
    escrow.status = 'held';
    await escrow.save();

    res.json({ escrow });
  } catch (err) {
    next(err);
  }
};

// POST /api/escrow/confirm-delivery — buyer confirms receipt; captures Stripe funds and releases escrow
const confirmDelivery = async (req, res, next) => {
  try {
    const { auctionId } = req.body;
    if (!auctionId) return res.status(400).json({ message: 'auctionId is required' });

    const escrow = await Escrow.findOne({ auction: auctionId });
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    if (!escrow.winner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the winner can confirm delivery' });
    }
    if (escrow.status !== 'held') {
      return res.status(400).json({ message: `Escrow is ${escrow.status} — payment must be held before confirming delivery` });
    }

    if (escrow.stripePaymentIntentId) {
      await stripeService.capturePaymentIntent(escrow.stripePaymentIntentId);
    }

    escrow.status = 'released';
    await escrow.save();

    res.json({ escrow });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEscrow, initPayment, markPaymentHeld, confirmDelivery };
