const Escrow = require('../models/Escrow');

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

// POST /api/escrow/confirm-delivery — buyer confirms receipt; releases escrow to seller
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

    escrow.status = 'released';
    await escrow.save();

    res.json({ escrow });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEscrow, confirmDelivery };
