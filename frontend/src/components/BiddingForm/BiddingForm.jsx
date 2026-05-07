import React, { useState } from 'react';

function formatAmount(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function BiddingForm({
  onPlaceBid,
  disabled,
  currentHighestBid,
  startingPrice,
  isSubmitting,
}) {
  const [amount,   setAmount]   = useState('');
  const [proxyMax, setProxyMax] = useState('');
  const [error,    setError]    = useState('');

  const minimumBid = currentHighestBid ? currentHighestBid + 1 : startingPrice;

  const proxyError = proxyMax && amount && Number.parseFloat(proxyMax) < Number.parseFloat(amount)
    ? 'Proxy max must be ≥ your bid.'
    : '';

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const numAmount = Number.parseFloat(amount);
    if (!amount || Number.isNaN(numAmount)) {
      setError('Please enter a valid bid amount.');
      return;
    }
    if (numAmount < minimumBid) {
      setError(`Bid must be at least ${formatAmount(minimumBid)}.`);
      return;
    }
    if (proxyError) return;

    onPlaceBid(numAmount, proxyMax ? Number.parseFloat(proxyMax) : null);
    setAmount('');
    setProxyMax('');
  }

  if (disabled) {
    return (
      <div className="bg-[#1e1e2e] border border-[#2a2a3d] rounded-xl p-6 text-center">
        <p className="text-gray-400 font-semibold text-base">Auction Closed</p>
        <p className="text-gray-600 text-sm mt-1">Bidding is no longer available.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Your Bid */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
          Your Bid{' '}
          <span className="text-gray-700 font-normal normal-case tracking-normal">
            (min {formatAmount(minimumBid)})
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
          <input
            type="number"
            min={minimumBid}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(minimumBid)}
            disabled={isSubmitting}
            className="input-dark w-full pl-7 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Proxy Max */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
          Proxy Max Bid{' '}
          <span className="text-gray-700 font-normal normal-case tracking-normal">
            (optional — auto-bids up to this limit)
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
          <input
            type="number"
            min={minimumBid}
            step="1"
            value={proxyMax}
            onChange={(e) => setProxyMax(e.target.value)}
            placeholder="Optional"
            disabled={isSubmitting}
            className={`input-dark w-full pl-7 disabled:opacity-50 ${proxyError ? 'border-red-500/60 focus:border-red-500' : ''}`}
          />
        </div>
        {proxyError && (
          <p className="text-red-400 text-xs mt-1.5">{proxyError}</p>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !!proxyError}
        className="btn-gradient w-full py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Placing Bid…
          </span>
        ) : (
          'Place Bid'
        )}
      </button>
    </form>
  );
}
