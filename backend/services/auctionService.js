const Escrow = require('../models/Escrow');
const { createPaymentIntent } = require('./stripeService');

// Shared close logic used by both the REST controller and the scheduler.
// Mutates auction in-place, persists it, creates Stripe PaymentIntent + Escrow when there is a winner,
// and emits auction_closed to the socket room.
// Returns { auction, clientSecret } — clientSecret is null when there is no winner.
const performClose = async (auction, io) => {
  auction.status = 'closed';

  const room = auction._id.toString();

  if (!auction.currentHighestBidder) {
    await auction.save();
    io.to(room).emit('auction_closed', {
      auctionId: auction._id,
      winnerId: null,
      finalAmount: null,
    });
    return { auction, clientSecret: null };
  }

  auction.winner = auction.currentHighestBidder;
  await auction.save();

  const paymentIntent = await createPaymentIntent({
    amount: auction.currentHighestBid,
    metadata: {
      auctionId: room,
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

  io.to(room).emit('auction_closed', {
    auctionId: auction._id,
    winnerId: auction.winner,
    finalAmount: auction.currentHighestBid,
  });

  return { auction, clientSecret: paymentIntent.client_secret };
};

module.exports = { performClose };
