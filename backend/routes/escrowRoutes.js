const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getEscrow, initPayment, markPaymentHeld, confirmDelivery } = require('../controllers/escrowController');

router.get('/auction/:auctionId', protect, getEscrow);
router.post('/init-payment',      protect, initPayment);
router.post('/mark-payment-held', protect, markPaymentHeld);
router.post('/confirm-delivery',  protect, confirmDelivery);

module.exports = router;
