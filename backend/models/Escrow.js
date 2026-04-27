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

escrowSchema.index({ winner: 1, createdAt: -1 });
escrowSchema.index({ seller: 1, createdAt: -1 });
escrowSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Escrow', escrowSchema);
