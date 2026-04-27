const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getEscrow, confirmDelivery } = require('../controllers/escrowController');

router.get('/auction/:auctionId', protect, getEscrow);
router.post('/confirm-delivery', protect, confirmDelivery);

module.exports = router;
