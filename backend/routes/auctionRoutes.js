const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const {
  createAuction,
  listAuctions,
  getAuction,
  closeAuction,
} = require('../controllers/auctionController');

router.get('/', optionalProtect, listAuctions);
router.get('/:id', getAuction);
router.post('/', protect, createAuction);
router.post('/:id/close', protect, closeAuction);

module.exports = router;
