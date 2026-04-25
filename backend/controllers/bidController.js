const Bid = require('../models/Bid');

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
    });

    // Notify outbid user; clients filter by outbidUserId to show their own notification
    if (previousHighestBidder && !previousHighestBidder.equals(bidderId)) {
      req.io.to(room).emit('outbid', {
        auctionId: room,
        outbidUserId: previousHighestBidder,
      });
    }

    res.status(201).json({ bid });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeBid };
