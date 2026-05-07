const Auction = require('../models/Auction');
const { performClose } = require('../services/auctionService');

const createAuction = async (req, res, next) => {
  try {
    const { title, description, images, startingPrice, reservePrice, auctionEndTime, category } = req.body;

    if (!title || !description || startingPrice == null || !auctionEndTime) {
      return res
        .status(400)
        .json({ message: 'title, description, startingPrice, and auctionEndTime are required' });
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
    const { status, category, seller } = req.query;
    const filter = {};
    if (seller === 'me' && req.user) filter.seller = req.user._id;
    else filter.status = status || 'active';
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

const cancelAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: 'Auction not found' });
    if (!['active', 'pending'].includes(auction.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${auction.status} auction` });
    }
    if (!auction.seller.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the seller can cancel this auction' });
    }

    auction.status = 'cancelled';
    await auction.save();

    // Void any escrow and Stripe PaymentIntent that may have been created
    const Escrow = require('../models/Escrow');
    const escrow = await Escrow.findOne({ auction: auction._id });
    if (escrow) {
      if (escrow.stripePaymentIntentId) {
        const stripeService = require('../services/stripeService');
        await stripeService.cancelPaymentIntent(escrow.stripePaymentIntentId).catch(() => {});
      }
      await escrow.deleteOne();
    }

    // Deactivate all proxy bids for this auction
    const ProxyBid = require('../models/ProxyBid');
    await ProxyBid.updateMany({ auction: auction._id }, { $set: { isActive: false } });

    req.io.to(auction._id.toString()).emit('auction_cancelled', { auctionId: auction._id });

    res.json({ auction });
  } catch (err) {
    next(err);
  }
};

module.exports = { createAuction, listAuctions, getAuction, closeAuction, cancelAuction };
