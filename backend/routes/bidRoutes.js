const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateBid } = require('../middleware/validate');
const { placeBid, placeProxyBid } = require('../controllers/bidController');

// POST /api/bids/:auctionId
router.post('/:auctionId', protect, validateBid, placeBid);

// POST /api/bids/:auctionId/proxy
router.post('/:auctionId/proxy', protect, placeProxyBid);

module.exports = router;
