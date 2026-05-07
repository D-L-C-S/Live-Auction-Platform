import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { initPayment } from '../../services/api';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#fff',
      fontFamily: 'inherit',
      letterSpacing: '0.02em',
      '::placeholder': { color: '#555' },
    },
    invalid: { color: '#f87171' },
  },
};

function CardForm({ clientSecret, amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (stripeError) {
      setError(stripeError.message);
      setProcessing(false);
      return;
    }

    // status is 'requires_capture' because capture_method is 'manual'
    if (paymentIntent.status === 'requires_capture') {
      onSuccess(paymentIntent.id);
    } else {
      setError(`Unexpected payment status: ${paymentIntent.status}`);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] mb-2">
          Card details
        </label>
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-4 py-3.5
                        focus-within:border-[#555] transition-colors duration-150">
          <CardElement options={CARD_STYLE} />
        </div>
        <p className="text-[11px] text-[#555] mt-2">
          Test card: 4242 4242 4242 4242 · any future date · any CVC
        </p>
      </div>

      {error && (
        <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20
                       rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-2.5 border border-[#2e2e2e] rounded-xl text-[12px] font-medium
                     text-[#888] hover:text-white hover:border-[#444] transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 py-2.5 bg-white text-[#080808] rounded-xl text-[12px] font-semibold
                     hover:bg-[#e8e8e8] active:scale-[0.98] transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing…' : `Pay ₹${Number(amount).toLocaleString('en-IN')}`}
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({ auctionId, amount, title, onSuccess, onClose }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stripePromise) {
      setError('Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in frontend/.env');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await initPayment(auctionId);
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [auctionId]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md
                      shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[15px] font-semibold text-white tracking-[-0.01em]">
              Confirm payment
            </h2>
            <p className="text-[12px] text-[#666] mt-0.5 truncate max-w-[260px]">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-white transition-colors duration-150 text-lg leading-none ml-4"
          >
            ✕
          </button>
        </div>

        {/* Amount */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 mb-5 flex
                        justify-between items-center">
          <span className="text-[11px] text-[#888] uppercase tracking-[0.08em]">Amount due</span>
          <span className="text-[18px] font-bold text-white tabular-nums tracking-[-0.02em]">
            ₹{Number(amount).toLocaleString('en-IN')}
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#2a2a2a] border-t-[#888] rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20
                         rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        {!loading && !error && clientSecret && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CardForm
              clientSecret={clientSecret}
              amount={amount}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
