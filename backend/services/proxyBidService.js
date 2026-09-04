const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const ProxyBid = require('../models/ProxyBid');

const DEFAULT_INCREMENT = Number(process.env.PROXY_BID_INCREMENT || 1);
const MAX_PROXY_ROUNDS = 100;

// Atomic filter shared by manual bids (bidController) and the proxy loop below:
// only match the auction if it's still open AND `amount` still beats the
// committed price. The null branch covers the first bid on an auction —
// Mongo's type-bracketed $lt does not match a null currentHighestBid.
const winsAgainst = (amount) => ({
	status: 'active',
	endTime: { $gt: new Date() },
	$or: [
		{ currentHighestBid: { $lt: amount } },
		{ currentHighestBid: null, startingPrice: { $lt: amount } },
	],
});

const ensureAuctionIsBiddable = (auction) => {
	if (auction.status !== 'active') {
		const err = new Error('Auction is not active');
		err.status = 400;
		throw err;
	}
	if (new Date() > auction.endTime) {
		const err = new Error('Auction has ended');
		err.status = 400;
		throw err;
	}
};

const emitBidEvents = ({ io, auctionId, bid, previousHighestBidder, isAuto }) => {
	if (!io) return;

	const room = String(auctionId);

	io.to(room).emit('new_bid', {
		auctionId: room,
		bidId: bid._id,
		bidder: bid.bidder,
		amount: bid.amount,
		placedAt: bid.createdAt,
		isAuto,
	});

	if (previousHighestBidder && !previousHighestBidder.equals(bid.bidder)) {
		io.to(room).emit('outbid', {
			auctionId: room,
			outbidUserId: previousHighestBidder,
		});
	}
};

const setProxyBid = async ({ auction, bidderId, maxBid }) => {
	ensureAuctionIsBiddable(auction);

	const numericMaxBid = Number(maxBid);
	const floor = auction.currentHighestBid ?? auction.startingPrice;

	if (!Number.isFinite(numericMaxBid) || numericMaxBid <= floor) {
		const err = new Error(`Proxy max bid must be greater than ${floor}`);
		err.status = 400;
		throw err;
	}

	const proxyBid = await ProxyBid.findOneAndUpdate(
		{ auction: auction._id, bidder: bidderId },
		{
			$set: {
				maxBid: numericMaxBid,
				bidIncrement: DEFAULT_INCREMENT,
				isActive: true,
			},
		},
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	);

	return proxyBid;
};

// Runs after every manual bid and after every proxy set. Each iteration decides
// against a freshly-read auction and commits with the same atomic compare-and-set
// as a manual bid, so a concurrent bid/loop can never cause a lost update. A Bid
// row is only written after its CAS wins.
const runProxyBidding = async ({ auctionId, io }) => {
	for (let round = 0; round < MAX_PROXY_ROUNDS; round += 1) {
		const auction = await Auction.findById(auctionId);
		if (!auction || auction.status !== 'active' || new Date() > auction.endTime) break;

		const highest = auction.currentHighestBid ?? auction.startingPrice;

		const query = {
			auction: auction._id,
			isActive: true,
			maxBid: { $gt: highest },
		};
		if (auction.currentHighestBidder) {
			query.bidder = { $ne: auction.currentHighestBidder };
		}

		const challenger = await ProxyBid.findOne(query).sort({ maxBid: -1, updatedAt: 1 });
		if (!challenger) break;

		const increment = challenger.bidIncrement || DEFAULT_INCREMENT;
		const nextAmount = Math.min(challenger.maxBid, highest + increment);
		if (nextAmount <= highest) break;

		const prev = await Auction.findOneAndUpdate(
			{ _id: auction._id, ...winsAgainst(nextAmount) },
			{ $set: { currentHighestBid: nextAmount, currentHighestBidder: challenger.bidder } },
			{ new: false }
		);
		if (!prev) continue; // a concurrent writer moved the price — re-read and re-evaluate

		const bid = await Bid.create({
			auction: auction._id,
			bidder: challenger.bidder,
			amount: nextAmount,
		});

		emitBidEvents({
			io,
			auctionId: auction._id,
			bid,
			previousHighestBidder: prev.currentHighestBidder,
			isAuto: true,
		});
	}
};

module.exports = {
	setProxyBid,
	runProxyBidding,
	winsAgainst,
};
