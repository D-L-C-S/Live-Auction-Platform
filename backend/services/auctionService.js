const Escrow = require('../models/Escrow');

// Shared close logic used by both the REST controller and the scheduler.
// Mutates auction in-place, persists it, creates an Escrow record when there is a winner,
// and emits auction_closed to the socket room.
const performClose = async (auction, io) => {
  auction.status = 'closed';

  const room = auction._id.toString();

  const reserveMet =
    !auction.reservePrice ||
    (auction.currentHighestBid != null && auction.currentHighestBid >= auction.reservePrice);

  if (!auction.currentHighestBidder || !reserveMet) {
    await auction.save();
    io.to(room).emit('auction_closed', {
      auctionId: auction._id,
      winnerId: null,
      finalAmount: null,
      reserveMet,
    });
    return { auction };
  }

  auction.winner = auction.currentHighestBidder;
  await auction.save();

  await Escrow.create({
    auction: auction._id,
    winner: auction.winner,
    seller: auction.seller,
    amount: auction.currentHighestBid,
    status: 'held',
  });

  io.to(room).emit('auction_closed', {
    auctionId: auction._id,
    winnerId: auction.winner,
    finalAmount: auction.currentHighestBid,
    reserveMet: true,
  });

  return { auction };
};

module.exports = { performClose };
