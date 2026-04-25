const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateBid } = require('../middleware/validate');
const { placeBid } = require('../controllers/bidController');

// POST /api/bids/:auctionId
router.post('/:auctionId', protect, validateBid, placeBid);

module.exports = router;
