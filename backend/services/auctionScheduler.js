const cron = require('node-cron');
const Auction = require('../models/Auction');
const { performClose } = require('./auctionService');
const { getIO } = require('./socketService');

const startScheduler = () => {
  cron.schedule('* * * * *', async () => {
    const io = getIO();

    const expired = await Auction.find({
      status: 'active',
      endTime: { $lte: new Date() },
    });

    for (const auction of expired) {
      try {
        await performClose(auction, io);
        console.log(`[scheduler] Closed auction ${auction._id}`);
      } catch (err) {
        console.error(`[scheduler] Failed to close auction ${auction._id}:`, err.message);
      }
    }
  });

  console.log('[scheduler] Auction scheduler started');
};

module.exports = { startScheduler };
