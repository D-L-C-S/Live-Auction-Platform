const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { runProxyBidding, setProxyBid } = require('../services/proxyBidService');

const placeBid = async (req, res, next) => {
  try {
    const auction = req.auction; // attached by validateBid
    const { amount } = req.body;
    const bidderId = req.user._id;

    const previousHighestBidder = auction.currentHighestBidder;

    const bid = await Bid.create({ auction: auction._id, bidder: bidderId, amount });

    auction.currentHighestBid = amount;
    auction.currentHighestBidder = bidderId;
    await auction.save();

    const room = auction._id.toString();

    req.io.to(room).emit('new_bid', {
      auctionId: room,
      bidId: bid._id,
      bidder: bidderId,
      amount,
      placedAt: bid.createdAt,
      isAuto: false,
    });

    // Notify outbid user; clients filter by outbidUserId to show their own notification
    if (previousHighestBidder && !previousHighestBidder.equals(bidderId)) {
      req.io.to(room).emit('outbid', {
        auctionId: room,
        outbidUserId: previousHighestBidder,
      });
    }

    await runProxyBidding({ auction, io: req.io });

    res.status(201).json({ bid });
  } catch (err) {
    next(err);
  }
};

const placeProxyBid = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const bidderId = req.user._id;
    const { maxBid } = req.body;

    const proxyBid = await setProxyBid({ auction, bidderId, maxBid });
    await runProxyBidding({ auction, io: req.io });

    res.status(200).json({
      proxyBid,
      currentHighestBid: auction.currentHighestBid,
      currentHighestBidder: auction.currentHighestBidder,
    });
  } catch (err) {
    next(err);
  }
};

// NEW: Fetch all previous bids for the room load
const getAuctionBids = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    
    // Finds all bids tied to this auction, sorts them highest amount to lowest
    const bids = await Bid.find({ auction: auctionId })
                          .populate('bidder', 'name username') 
                          .sort({ amount: -1 });
                          
    res.status(200).json(bids);
  } catch (err) {
    next(err); // Matches your existing error handling structure
  }
};

// Make sure to export the new function here!
module.exports = { placeBid, placeProxyBid, getAuctionBids };