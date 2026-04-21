const router = require('express').Router();
const auth = require('../middleware/auth');
const { createAuction, getAuctions, getAuction, closeAuction } = require('../controllers/auctionController');

router.get('/', getAuctions);
router.get('/:id', getAuction);
router.post('/', auth, createAuction);
router.patch('/:id/close', auth, closeAuction);

module.exports = router;
