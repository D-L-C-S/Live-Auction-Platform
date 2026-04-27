const express = require('express');
const router = express.Router();
const { stripeWebhook } = require('../controllers/webhookController');

// express.raw() is required here — Stripe signature verification needs the raw request body.
// This router must be mounted BEFORE app.use(express.json()) in server.js.
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
