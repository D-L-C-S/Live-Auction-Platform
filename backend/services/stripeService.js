const stripe = require('../config/stripe');

// All amounts are in the currency's smallest unit (paise for INR).
const toSmallestUnit = (amount) => Math.round(amount * 100);

const createPaymentIntent = ({ amount, currency = 'inr', metadata = {} }) =>
  stripe.paymentIntents.create({
    amount: toSmallestUnit(amount),
    currency,
    capture_method: 'manual', // hold funds; capture on delivery confirmation
    metadata,
  });

const capturePaymentIntent = (paymentIntentId) =>
  stripe.paymentIntents.capture(paymentIntentId);

const cancelPaymentIntent = (paymentIntentId) =>
  stripe.paymentIntents.cancel(paymentIntentId);

module.exports = { createPaymentIntent, capturePaymentIntent, cancelPaymentIntent };
