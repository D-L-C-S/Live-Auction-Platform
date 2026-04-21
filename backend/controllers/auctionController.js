const Auction = require('../models/Auction');

exports.createAuction = async (req, res) => {
  try {
    const auction = await Auction.create({ ...req.body, seller: req.user.id, currentPrice: req.body.startingPrice });
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ status: 'active' }).populate('seller', 'name');
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('seller', 'name').populate('winner', 'name');
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.closeAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(req.params.id, { status: 'ended' }, { new: true });
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
