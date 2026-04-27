const mongoose = require('mongoose');

const proxyBidSchema = new mongoose.Schema(
	{
		auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true, index: true },
		bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		maxBid: { type: Number, required: true, min: 0 },
		bidIncrement: { type: Number, default: 1, min: 1 },
		isActive: { type: Boolean, default: true, index: true },
	},
	{ timestamps: true }
);

proxyBidSchema.index({ auction: 1, bidder: 1 }, { unique: true });
proxyBidSchema.index({ auction: 1, isActive: 1, maxBid: -1, updatedAt: 1 });

module.exports = mongoose.model('ProxyBid', proxyBidSchema);
