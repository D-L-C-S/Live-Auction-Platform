import React, { useState } from 'react';

function formatAmount(n) {
  return '$' + Number(n).toLocaleString('en-US');
}

// Props:
//   onPlaceBid(amount, proxyMax) — called when user submits
//   disabled — true when auction is closed
//   currentHighestBid — current top bid (null if no bids yet)
//   startingPrice — minimum first bid
//   isSubmitting — true while API call is in flight
export default function BiddingForm({
  onPlaceBid,
  disabled,
  currentHighestBid,
  startingPrice,
  isSubmitting,
}) {
  const [amount, setAmount] = useState('');
  const [proxyMax, setProxyMax] = useState('');
  const [error, setError] = useState('');

  const minimumBid = currentHighestBid ? currentHighestBid + 1 : startingPrice;

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid bid amount.');
      return;
    }
    if (numAmount < minimumBid) {
      setError(`Bid must be at least ${formatAmount(minimumBid)}.`);
      return;
    }
    if (proxyMax && parseFloat(proxyMax) < numAmount) {
      setError('Proxy max must be greater than or equal to your bid.');
      return;
    }

    onPlaceBid(numAmount, proxyMax ? parseFloat(proxyMax) : null);
    setAmount('');
    setProxyMax('');
  }

  if (disabled) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-xl p-6 text-center">
        <p className="text-gray-500 font-semibold text-lg">Auction Closed</p>
        <p className="text-gray-400 text-sm mt-1">Bidding is no longer available.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Bid
          <span className="text-gray-400 font-normal ml-1">(min {formatAmount(minimumBid)})</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
          <input
            type="number"
            min={minimumBid}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(minimumBid)}
            disabled={isSubmitting}
            className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Proxy Max Bid
          <span className="text-gray-400 font-normal ml-1">(optional — auto-bids up to this limit)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
          <input
            type="number"
            min={minimumBid}
            step="1"
            value={proxyMax}
            onChange={(e) => setProxyMax(e.target.value)}
            placeholder="Optional"
            disabled={isSubmitting}
            className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {isSubmitting ? 'Placing Bid…' : 'Place Bid'}
      </button>
    </form>
  );
}
