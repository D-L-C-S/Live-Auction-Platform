import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  return name.length > 18 ? name.slice(0, 15) + '…' : name;
}

function avatarLetter(bidder) {
  const name = bidder?.name || bidder?._id || String(bidder || 'A');
  return (name[0] || 'A').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-cyan-500/20 text-cyan-400',
  'bg-violet-500/20 text-violet-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
];

function avatarColor(bidder) {
  const key = bidder?.name || bidder?._id || '';
  const code = key.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export default function BidFeed({ bids, isSeller }) {
  if (!bids || bids.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-[13px] text-[#888]">
          {isSeller ? 'No bids yet.' : 'No bids yet — be first.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
      <AnimatePresence initial={false}>
        {bids.map((bid, i) => (
          <motion.div
            key={bid._id || i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg
              ${i === 0
                ? 'bg-[#1a1a1a] border border-cyan-400/15'
                : 'bg-[#111] border border-[#2e2e2e] hover:border-[#242424] transition-colors'
              }`}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                              text-[11px] font-bold shrink-0 ${avatarColor(bid.bidder)}`}>
                {avatarLetter(bid.bidder)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {i === 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em]
                                     text-cyan-400 bg-cyan-400/10 border border-cyan-400/20
                                     px-1.5 py-0.5 rounded shrink-0">
                      Lead
                    </span>
                  )}
                  <span className={`text-[13px] font-medium truncate
                    ${i === 0 ? 'text-[#e0e0e0]' : 'text-[#888]'}`}>
                    {shortName(bid.bidder)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount + time */}
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span className={`text-[13px] font-bold tabular-nums
                ${i === 0 ? 'text-white' : 'text-[#aaa]'}`}>
                {formatAmount(bid.amount)}
              </span>
              <span className="text-[11px] text-[#888] tabular-nums w-14 text-right">
                {relativeTime(bid.placedAt)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
