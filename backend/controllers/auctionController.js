const Auction = require('../models/Auction');
const Escrow = require('../models/Escrow');
const { createPaymentIntent } = require('../services/stripeService');

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

// Called by the seller to close the auction (and by the scheduled job when endTime passes).
// Creates a Stripe PaymentIntent + Escrow record when there is a winner.
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

    auction.status = 'closed';

    if (!auction.currentHighestBidder) {
      // No bids — close with no winner, no escrow
      await auction.save();
      req.io.to(auction._id.toString()).emit('auction_closed', {
        auctionId: auction._id,
        winnerId: null,
        finalAmount: null,
      });
      return res.json({ auction });
    }

    auction.winner = auction.currentHighestBidder;
    await auction.save();

    const paymentIntent = await createPaymentIntent({
      amount: auction.currentHighestBid,
      metadata: {
        auctionId: auction._id.toString(),
        winnerId: auction.winner.toString(),
        sellerId: auction.seller.toString(),
      },
    });

    await Escrow.create({
      auction: auction._id,
      winner: auction.winner,
      seller: auction.seller,
      amount: auction.currentHighestBid,
      stripePaymentIntentId: paymentIntent.id,
      status: 'held',
    });

    req.io.to(auction._id.toString()).emit('auction_closed', {
      auctionId: auction._id,
      winnerId: auction.winner,
      finalAmount: auction.currentHighestBid,
    });

    // clientSecret is sent to the winner's frontend to confirm payment via Stripe.js
    res.json({ auction, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
};

module.exports = { createAuction, listAuctions, getAuction, closeAuction };
