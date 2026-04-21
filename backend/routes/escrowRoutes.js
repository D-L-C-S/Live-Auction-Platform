const router = require('express').Router();
const auth = require('../middleware/auth');
const { initiateEscrow, confirmDelivery, getEscrow } = require('../controllers/escrowController');

router.post('/initiate', auth, initiateEscrow);
router.patch('/:auctionId/confirm-delivery', auth, confirmDelivery);
router.get('/:auctionId', auth, getEscrow);

module.exports = router;
