const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboard } = require('../controllers/bidderController');

// GET /api/bidders/dashboard — returns active bids and won auctions for the logged-in user
router.get('/dashboard', protect, getDashboard);

module.exports = router;
