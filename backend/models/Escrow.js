const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true, unique: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  stripePaymentIntentId: { type: String },
  status: { type: String, enum: ['pending', 'held', 'released', 'refunded'], default: 'pending' },
  deliveryConfirmedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Escrow', escrowSchema);
