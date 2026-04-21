const Escrow = require('../models/Escrow');
const Auction = require('../models/Auction');
const stripeService = require('../services/stripeService');

exports.initiateEscrow = async (req, res) => {
  try {
    const { auctionId } = req.body;
    const auction = await Auction.findById(auctionId).populate('winner seller');
    if (!auction || auction.status !== 'ended') return res.status(400).json({ message: 'Auction not ended' });

    const paymentIntent = await stripeService.createPaymentIntent(auction.currentPrice, req.user.id, auctionId);

    const escrow = await Escrow.create({
      auction: auctionId,
      buyer: auction.winner._id,
      seller: auction.seller._id,
      amount: auction.currentPrice,
      stripePaymentIntentId: paymentIntent.id,
      status: 'held',
    });

    res.status(201).json({ escrow, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmDelivery = async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ auction: req.params.auctionId });
    if (!escrow || escrow.status !== 'held') return res.status(400).json({ message: 'Invalid escrow state' });

    await stripeService.transferToSeller(escrow);
    escrow.status = 'released';
    escrow.deliveryConfirmedAt = new Date();
    await escrow.save();

    res.json(escrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEscrow = async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ auction: req.params.auctionId }).populate('buyer seller', 'name email');
    if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
    res.json(escrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
