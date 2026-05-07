const stripe = require('../config/stripe');

const assertStripe = () => {
  if (!stripe) throw Object.assign(new Error('Stripe is not configured on this server'), { status: 503 });
};

// Creates a PaymentIntent with capture_method: manual — funds are authorized but not captured.
// Capture happens later when the buyer confirms delivery.
const createPaymentIntent = async (amountINR, metadata = {}) => {
  assertStripe();
  return stripe.paymentIntents.create({
    amount: Math.round(amountINR * 100), // rupees → paise
    currency: 'usd',
    capture_method: 'manual',
    metadata,
  });
};

const capturePaymentIntent = async (paymentIntentId) => {
  assertStripe();
  return stripe.paymentIntents.capture(paymentIntentId);
};

const cancelPaymentIntent = async (paymentIntentId) => {
  assertStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
};

const retrievePaymentIntent = async (paymentIntentId) => {
  assertStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

module.exports = { createPaymentIntent, capturePaymentIntent, cancelPaymentIntent, retrievePaymentIntent };
