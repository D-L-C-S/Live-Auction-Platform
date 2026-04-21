const router = require('express').Router();
const auth = require('../middleware/auth');
const { placeBid, getBidHistory, setProxyBid } = require('../controllers/bidController');

router.post('/', auth, placeBid);
router.post('/proxy', auth, setProxyBid);
router.get('/:auctionId/history', getBidHistory);

module.exports = router;
