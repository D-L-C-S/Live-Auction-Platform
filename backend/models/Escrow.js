const mongoose = require('mongoose');

const escrowSchema = new mongoose.Schema(
  {
    auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true, unique: true },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    stripePaymentIntentId: { type: String, required: true },
    status: {
      type: String,
      enum: ['held', 'released', 'refunded'],
      default: 'held',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Escrow', escrowSchema);
