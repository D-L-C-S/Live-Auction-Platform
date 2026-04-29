const Auction = require('../models/Auction');
const { performClose } = require('../services/auctionService');

const createAuction = async (req, res, next) => {
  try {
    const { title, description, images, startingPrice, reservePrice, auctionEndTime, category } =
      req.body;

    if (!title || startingPrice == null || !auctionEndTime) {
      return res
        .status(400)
        .json({ message: 'title, startingPrice, and auctionEndTime are required' });
    }

    const endTime = new Date(auctionEndTime);
    if (Number.isNaN(endTime.getTime()) || endTime <= new Date()) {
      return res.status(400).json({ message: 'auctionEndTime must be a valid future date' });
    }

    const auction = await Auction.create({
      title,
      description,
      images: images || [],
      seller: req.user._id,
      startingPrice: Number(startingPrice),
      reservePrice: reservePrice == null ? null : Number(reservePrice),
      startTime: new Date(),
      endTime,
      status: 'active',
      category,
    });

    res.status(201).json({ auction });
  } catch (err) {
    next(err);
  }
};

const listAuctions = async (req, res, next) => {
  try {
    const { status = 'active', category } = req.query;
    const filter = { status };
    if (category) filter.category = category;

    const auctions = await Auction.find(filter)
      .populate('seller', 'name')
      .sort({ endTime: 1 })
      .lean();

    res.json({ auctions });
  } catch (err) {
    next(err);
  }
};

const getAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email')
      .populate('currentHighestBidder', 'name')
      .populate('winner', 'name email');

    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    res.json({ auction });
  } catch (err) {
    next(err);
  }
};

const closeAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }
    if (!auction.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the seller can close this auction' });
    }

    const { auction: closed } = await performClose(auction, req.io);
    res.json({ auction: closed });
  } catch (err) {
    next(err);
  }
};

module.exports = { createAuction, listAuctions, getAuction, closeAuction };
