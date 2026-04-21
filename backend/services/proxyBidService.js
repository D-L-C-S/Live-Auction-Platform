const ProxyBid = require('../models/ProxyBid');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');

exports.setProxyBid = async (auctionId, bidderId, maxAmount) => {
  const existing = await ProxyBid.findOne({ auction: auctionId, bidder: bidderId });
  if (existing) {
    existing.maxAmount = maxAmount;
    existing.isActive = true;
    return existing.save();
  }
  return ProxyBid.create({ auction: auctionId, bidder: bidderId, maxAmount });
};

exports.processProxyBids = async (auctionId, newBidAmount, triggeredByBidder, io) => {
  const proxies = await ProxyBid.find({
    auction: auctionId,
    isActive: true,
    bidder: { $ne: triggeredByBidder },
    maxAmount: { $gt: newBidAmount },
  }).sort('maxAmount');

  if (!proxies.length) return;

  const topProxy = proxies[proxies.length - 1];
  const nextBid = Math.min(newBidAmount + topProxy.incrementStep, topProxy.maxAmount);

  const bid = await Bid.create({
    auction: auctionId,
    bidder: topProxy.bidder,
    amount: nextBid,
    isProxyTriggered: true,
  });

  await Auction.findByIdAndUpdate(auctionId, { currentPrice: nextBid });
  io.to(auctionId).emit('new_bid', { bid, currentPrice: nextBid });
};
