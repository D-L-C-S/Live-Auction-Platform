const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [String],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startingPrice: { type: Number, required: true, min: 0 },
    reservePrice: { type: Number, default: null },
    currentHighestBid: { type: Number, default: null },
    currentHighestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'closed', 'cancelled'],
      default: 'pending',
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    category: { type: String, trim: true },
  },
  { timestamps: true }
);

auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Auction', auctionSchema);
