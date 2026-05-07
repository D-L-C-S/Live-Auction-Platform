import React from 'react';

function formatAmount(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10)   return 'just now';
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function shortName(bidder) {
  if (!bidder) return 'Anonymous';
  const name = bidder.name || bidder._id || String(bidder);
  return name.length > 16 ? name.slice(0, 13) + '…' : name;
}

export default function BidFeed({ bids, isSeller }) {
  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        {isSeller ? 'No bids yet.' : 'No bids yet. Be the first to bid!'}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {bids.map((bid, i) => (
        <div
          key={bid._id || i}
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors duration-150
            ${i === 0
              ? 'bg-gradient-to-r from-violet-900/40 to-blue-900/40 border border-violet-500/30'
              : 'bg-[#1e1e2e] border border-[#2a2a3d] hover:border-[#3a3a5c]'
            }`}
        >
          <div className="flex items-center gap-2">
            {i === 0 && (
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                TOP
              </span>
            )}
            <span className={`font-medium ${i === 0 ? 'text-violet-300' : 'text-gray-300'}`}>
              {shortName(bid.bidder)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`font-bold ${i === 0 ? 'text-violet-200' : 'text-gray-200'}`}>
              {formatAmount(bid.amount)}
            </span>
            <span className="text-gray-700 text-xs">{relativeTime(bid.placedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
