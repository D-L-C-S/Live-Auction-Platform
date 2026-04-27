const Escrow = require('../models/Escrow');
const { capturePaymentIntent } = require('../services/stripeService');

// GET /api/escrow/auction/:auctionId — winner or seller can check escrow status
const getEscrow = async (req, res, next) => {
  try {
    const escrow = await Escrow.findOne({ auction: req.params.auctionId })
      .populate('winner', 'name email')
      .populate('seller', 'name email');

    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });

    const userId = req.user._id;
    if (!escrow.winner._id.equals(userId) && !escrow.seller._id.equals(userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ escrow });
  } catch (err) {
    next(err);
  }
};

// POST /api/escrow/confirm-delivery — buyer confirms receipt; triggers Stripe capture
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
      return res.status(400).json({ message: `Escrow is already ${escrow.status}` });
    }

    await capturePaymentIntent(escrow.stripePaymentIntentId);

    escrow.status = 'released';
    await escrow.save();

    res.json({ escrow });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEscrow, confirmDelivery };
