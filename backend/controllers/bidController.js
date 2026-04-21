const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const proxyBidService = require('../services/proxyBidService');

exports.placeBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'active') return res.status(400).json({ message: 'Auction not active' });
    if (amount <= auction.currentPrice) return res.status(400).json({ message: 'Bid must exceed current price' });

    const bid = await Bid.create({ auction: auctionId, bidder: req.user.id, amount });
    await Auction.findByIdAndUpdate(auctionId, { currentPrice: amount });

    // Trigger proxy bids from competing bidders
    await proxyBidService.processProxyBids(auctionId, amount, req.user.id, req.io);

    req.io.to(auctionId).emit('new_bid', { bid, currentPrice: amount });
    res.status(201).json(bid);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBidHistory = async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId }).populate('bidder', 'name').sort('-createdAt');
    res.json(bids);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setProxyBid = async (req, res) => {
  try {
    const result = await proxyBidService.setProxyBid(req.body.auctionId, req.user.id, req.body.maxAmount);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
