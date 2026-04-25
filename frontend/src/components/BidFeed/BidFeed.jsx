import React from 'react';

function formatAmount(n) {
  return '$' + Number(n).toLocaleString('en-US');
}

// Shows a relative timestamp like "2m ago" or "just now"
function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// Truncates long user ids/names for display
function shortName(bidder) {
  if (!bidder) return 'Anonymous';
  const name = bidder.name || bidder._id || String(bidder);
  return name.length > 16 ? name.slice(0, 13) + '…' : name;
}

// bids prop: [{ bidder, amount, placedAt }] — newest first
export default function BidFeed({ bids }) {
  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No bids yet. Be the first to bid!
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {bids.map((bid, i) => (
        <div
          key={bid._id || i}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
            i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            {i === 0 && (
              <span className="text-blue-600 font-bold text-xs">TOP</span>
            )}
            <span className="font-medium text-gray-800">{shortName(bid.bidder)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900">{formatAmount(bid.amount)}</span>
            <span className="text-gray-400 text-xs">{relativeTime(bid.placedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
