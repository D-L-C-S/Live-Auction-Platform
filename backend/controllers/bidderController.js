const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Escrow = require('../models/Escrow');
const ProxyBid = require('../models/ProxyBid');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Auctions this user has placed at least one bid on, and are still active
    const biddedAuctionIds = await Bid.find({ bidder: userId }).distinct('auction');
    const activeAuctions = await Auction.find({
      _id: { $in: biddedAuctionIds },
      status: 'active',
    }).lean();

    const proxyBids = await ProxyBid.find({
      auction: { $in: activeAuctions.map((a) => a._id) },
      bidder: userId,
      isActive: true,
    }).lean();
    const proxyMap = new Map(proxyBids.map((p) => [p.auction.toString(), p.maxBid]));

    const activeBids = activeAuctions.map((a) => ({
      _id: a._id,
      title: a.title,
      currentHighestBid: a.currentHighestBid,
      myMaxBid: proxyMap.get(a._id.toString()) ?? null,
      endTime: a.endTime,
    }));

    // Auctions this user won
    const wonAuctions = await Auction.find({ winner: userId, status: 'closed' }).lean();
    const escrows = await Escrow.find({ winner: userId }).lean();
    const escrowMap = new Map(escrows.map((e) => [e.auction.toString(), e.status]));

    const wonWithEscrow = wonAuctions.map((a) => ({
      _id: a._id,
      title: a.title,
      finalAmount: a.currentHighestBid,
      escrowStatus: escrowMap.get(a._id.toString()) ?? null,
    }));

    res.json({ activeBids, wonAuctions: wonWithEscrow });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
