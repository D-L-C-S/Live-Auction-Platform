const Auction = require('../models/Auction');

// Cheap, friendly pre-check. NOT the authoritative gate — placeBid re-checks
// every race-sensitive condition inside an atomic findOneAndUpdate, because
// anything read here can go stale before the write lands.
const validateBid = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Bid amount must be a positive number' });
    }

    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    if (auction.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'You cannot bid on your own auction' });
    }
    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }
    if (new Date() > auction.endTime) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    const floor = auction.currentHighestBid ?? auction.startingPrice;
    if (amount <= floor) {
      return res.status(400).json({ message: `Bid must be greater than ${floor}` });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validateBid };
