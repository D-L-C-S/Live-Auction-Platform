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
  const [showProxy, setShowProxy] = useState(false);

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
    setShowProxy(false);
  }

  if (disabled) {
    return (
      <div className="bg-[#111] border border-[#2e2e2e] rounded-xl p-6 text-center">
        <p className="text-[#888] font-semibold text-sm">Auction Closed</p>
        <p className="text-[#888] text-[12px] mt-1">Bidding has ended.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Bid amount */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="field-label">Your Bid</label>
          <span className="text-[11px] text-[#888]">
            min {formatAmount(minimumBid)}
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm font-medium select-none">
            ₹
          </span>
          <input
            type="number"
            min={minimumBid}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(minimumBid)}
            disabled={isSubmitting}
            className="input-dark w-full pl-7 disabled:opacity-40"
          />
        </div>
      </div>

      {/* Proxy toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowProxy(!showProxy)}
          className="flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#888]
                     transition-colors duration-150"
        >
          <span className={`w-3.5 h-3.5 border border-[#333] rounded transition-all duration-150
            ${showProxy ? 'bg-cyan-400/20 border-cyan-400/40' : ''}`} />
          Auto-bid (proxy max)
          <span className="text-[#999]">— optional</span>
        </button>

        {showProxy && (
          <div className="mt-2">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999] text-sm font-medium select-none">
                ₹
              </span>
              <input
                type="number"
                min={minimumBid}
                step="1"
                value={proxyMax}
                onChange={(e) => setProxyMax(e.target.value)}
                placeholder="Maximum limit"
                disabled={isSubmitting}
                className={`input-dark w-full pl-7 disabled:opacity-40
                  ${proxyError ? 'border-red-500/40 focus:border-red-500/60' : ''}`}
              />
            </div>
            {proxyError && (
              <p className="text-red-400 text-[12px] mt-1.5">{proxyError}</p>
            )}
            <p className="text-[11px] text-[#888] mt-1.5">
              System auto-bids on your behalf up to this limit.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-[12px]">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !!proxyError}
        className="btn-primary w-full py-3 rounded-xl text-[13px] font-semibold
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-[#080808]/30 border-t-[#080808] rounded-full animate-spin" />
            Placing Bid…
          </span>
        ) : (
          'Place Bid'
        )}
      </button>
    </form>
  );
}
