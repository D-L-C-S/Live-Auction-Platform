const mongoose = require('mongoose');

const proxyBidSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxAmount: { type: Number, required: true },
  incrementStep: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ProxyBid', proxyBidSchema);
