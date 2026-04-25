const Auction = require('../models/Auction');

const validateBid = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.auctionId);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }
    if (new Date() > auction.endTime) {
      return res.status(400).json({ message: 'Auction has ended' });
    }

    const { amount } = req.body;
    // floor is the current highest bid, or the starting price if no bids yet
    const floor = auction.currentHighestBid ?? auction.startingPrice;

    if (typeof amount !== 'number' || amount <= floor) {
      return res.status(400).json({ message: `Bid must be greater than ${floor}` });
    }

    req.auction = auction;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { validateBid };
