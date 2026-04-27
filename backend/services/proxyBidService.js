const Bid = require('../models/Bid');
const ProxyBid = require('../models/ProxyBid');

const DEFAULT_INCREMENT = Number(process.env.PROXY_BID_INCREMENT || 1);
const MAX_PROXY_ROUNDS = 100;

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

const emitBidEvents = ({ io, auction, bid, previousHighestBidder, isAuto }) => {
	if (!io) return;

	const room = auction._id.toString();

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

const runProxyBidding = async ({ auction, io }) => {
	ensureAuctionIsBiddable(auction);

	let rounds = 0;

	while (rounds < MAX_PROXY_ROUNDS) {
		const currentHighestBid = auction.currentHighestBid ?? auction.startingPrice;
		const query = {
			auction: auction._id,
			isActive: true,
			maxBid: { $gt: currentHighestBid },
		};

		if (auction.currentHighestBidder) {
			query.bidder = { $ne: auction.currentHighestBidder };
		}

		const challenger = await ProxyBid.findOne(query).sort({ maxBid: -1, updatedAt: 1 });
		if (!challenger) break;

		const increment = challenger.bidIncrement || DEFAULT_INCREMENT;
		const nextBidAmount = Math.min(challenger.maxBid, currentHighestBid + increment);

		if (nextBidAmount <= currentHighestBid) break;

		const previousHighestBidder = auction.currentHighestBidder;
		const bid = await Bid.create({
			auction: auction._id,
			bidder: challenger.bidder,
			amount: nextBidAmount,
		});

		auction.currentHighestBid = nextBidAmount;
		auction.currentHighestBidder = challenger.bidder;
		await auction.save();

		emitBidEvents({ io, auction, bid, previousHighestBidder, isAuto: true });
		rounds += 1;
	}

	return auction;
};

module.exports = {
	setProxyBid,
	runProxyBidding,
};
