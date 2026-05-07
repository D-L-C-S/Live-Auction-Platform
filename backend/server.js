require('dotenv').config();
const express = require('express');
const http = require('node:http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');

const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const bidderRoutes = require('./routes/bidderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { startScheduler } = require('./services/auctionScheduler');
const { cleanOrphanedUploads } = require('./services/uploadCleanup');

const app = express();
const server = http.createServer(app);

const socketMiddleware = initSocket(server);

connectDB().then(() => {
  startScheduler();
  cleanOrphanedUploads();
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use('/uploads', express.static(require('node:path').join(__dirname, 'uploads')));

// Stripe webhook must receive the raw body — register before express.json()
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
  const stripe = require('./config/stripe');
  const Escrow = require('./models/Escrow');
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook signature error: ${err.message}`);
    }
    // When capture_method:'manual' payment is authorized, move escrow to held
    if (event.type === 'payment_intent.amount_capturable_updated') {
      const pi = event.data.object;
      const auctionId = pi.metadata?.auctionId;
      if (auctionId) {
        await Escrow.findOneAndUpdate(
          { auction: auctionId, status: 'pending_payment' },
          { $set: { status: 'held', stripePaymentIntentId: pi.id } }
        );
      }
    }
    res.json({ received: true });
  });
}

app.use(express.json());
app.use(socketMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/bidders', bidderRoutes);
app.use('/api/upload', uploadRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
