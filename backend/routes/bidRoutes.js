const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateBid } = require('../middleware/validate');
// 1. ADDED getAuctionBids TO THE IMPORT LIST HERE:
const { placeBid, placeProxyBid, getAuctionBids } = require('../controllers/bidController'); 

// POST /api/bids/:auctionId
router.post('/:auctionId', protect, validateBid, placeBid);

// POST /api/bids/:auctionId/proxy
router.post('/:auctionId/proxy', protect, placeProxyBid);

// GET /api/bids/:auctionId
// 2. SHORTENED THE PATH TO MATCH THE OTHERS
router.get('/:auctionId', getAuctionBids); 

module.exports = router;