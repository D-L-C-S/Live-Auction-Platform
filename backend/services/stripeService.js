const stripe = require('../config/stripe');

const toSmallestUnit = (amount) => Math.round(amount * 100);

const createPaymentIntent = ({ amount, currency = 'inr', metadata = {} }) => {
  if (!stripe) {
    return Promise.resolve({ id: `pi_mock_${Date.now()}`, client_secret: null });
  }
  return stripe.paymentIntents.create({
    amount: toSmallestUnit(amount),
    currency,
    capture_method: 'manual',
    metadata,
  });
};

const capturePaymentIntent = (paymentIntentId) => {
  if (!stripe) return Promise.resolve({});
  return stripe.paymentIntents.capture(paymentIntentId);
};

const cancelPaymentIntent = (paymentIntentId) => {
  if (!stripe) return Promise.resolve({});
  return stripe.paymentIntents.cancel(paymentIntentId);
};

module.exports = { createPaymentIntent, capturePaymentIntent, cancelPaymentIntent };
