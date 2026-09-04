const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { runProxyBidding, setProxyBid, winsAgainst } = require('../services/proxyBidService');

const placeBid = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    const bidderId = req.user._id;

    // Compare-and-set. If another bid moved the price (or the auction closed)
    // between validateBid and now, this matches nothing and returns null —
    // so two concurrent bids can never both win.
    const prev = await Auction.findOneAndUpdate(
      { _id: auctionId, ...winsAgainst(amount) },
      { $set: { currentHighestBid: amount, currentHighestBidder: bidderId } },
      { new: false } // pre-update doc → tells us who was leading, for the outbid event
    );

    if (!prev) {
      // We lost the race (or the auction is no longer biddable). Re-read to say why.
      const current = await Auction.findById(auctionId).lean();
      if (!current) return res.status(404).json({ message: 'Auction not found' });
      if (current.status !== 'active') {
        return res.status(409).json({ code: 'AUCTION_CLOSED', message: 'This auction is no longer active.' });
      }
      if (new Date() > current.endTime) {
        return res.status(409).json({ code: 'AUCTION_ENDED', message: 'This auction has ended.' });
      }
      const price = current.currentHighestBid ?? current.startingPrice;
      return res.status(409).json({
        code: 'PRICE_CHANGED',
        message: `Your bid of ₹${amount} is no longer high enough — the price moved to ₹${price}. Place a higher bid.`,
        currentHighestBid: current.currentHighestBid,
        startingPrice: current.startingPrice,
      });
    }

    // CAS won — now it's safe to persist the Bid row.
    const bid = await Bid.create({ auction: auctionId, bidder: bidderId, amount });

    const room = String(auctionId);
    req.io.to(room).emit('new_bid', {
      auctionId: room,
      bidId: bid._id,
      bidder: bidderId,
      amount,
      placedAt: bid.createdAt,
      isAuto: false,
    });

    const previousHighestBidder = prev.currentHighestBidder;
    if (previousHighestBidder && !previousHighestBidder.equals(bidderId)) {
      req.io.to(room).emit('outbid', {
        auctionId: room,
        outbidUserId: previousHighestBidder,
      });
    }

    await runProxyBidding({ auctionId, io: req.io });

    res.status(201).json({ bid });
  } catch (err) {
    next(err);
  }
};

const placeProxyBid = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const bidderId = req.user._id;
    const { maxBid } = req.body;

    const proxyBid = await setProxyBid({ auction, bidderId, maxBid });
    await runProxyBidding({ auctionId, io: req.io });

    // re-read so the response reflects any auto-bids the loop just placed
    const fresh = await Auction.findById(auctionId).lean();
    res.status(200).json({
      proxyBid,
      currentHighestBid: fresh.currentHighestBid,
      currentHighestBidder: fresh.currentHighestBidder,
    });
  } catch (err) {
    next(err);
  }
};

// Fetch all bids for an auction, highest first — used for the room's initial load.
const getAuctionBids = async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const bids = await Bid.find({ auction: auctionId })
      .populate('bidder', 'name username')
      .sort({ amount: -1 });
    res.status(200).json(bids);
  } catch (err) {
    next(err);
  }
};

module.exports = { placeBid, placeProxyBid, getAuctionBids };
