import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchAuctions, toAssetUrl } from '../services/api';
import CountdownTimer from '../components/CountdownTimer/CountdownTimer';

function formatAmount(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function AuctionImage({ src, alt }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-[#2a2a2a]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none"
             viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      onError={() => setError(true)}
    />
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function AuctionListingPage() {
  const [auctions,   setAuctions]   = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy,     setSortBy]     = useState('endingSoon');

  useEffect(() => {
    fetchAuctions()
      .then(setAuctions)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return auctions;
    return auctions.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        (a.category || '').toLowerCase().includes(term)
    );
  }, [auctions, searchTerm]);

  const sorted = useMemo(() => {
    const active = filtered.filter((a) => a.status !== 'closed');
    const closed = filtered.filter((a) => a.status === 'closed');

    if (sortBy === 'endingSoon') {
      active.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
    } else if (sortBy === 'priceLow') {
      active.sort(
        (a, b) =>
          (a.currentHighestBid ?? a.startingPrice) -
          (b.currentHighestBid ?? b.startingPrice)
      );
    } else if (sortBy === 'priceHigh') {
      active.sort(
        (a, b) =>
          (b.currentHighestBid ?? b.startingPrice) -
          (a.currentHighestBid ?? a.startingPrice)
      );
    }
    return [...active, ...closed];
  }, [filtered, sortBy]);

  const activeCount = auctions.filter((a) => a.status !== 'closed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#888] mb-3">
          Browse
        </p>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-white leading-none">
            Live Auctions
          </h1>
          {!isLoading && (
            <span className="text-[13px] text-[#999] pb-1">
              {activeCount} active
            </span>
          )}
        </div>
      </motion.div>

      {/* Search + Sort */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888]"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or category"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark w-full pl-9"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-dark pr-8 cursor-pointer"
        >
          <option value="endingSoon">Ending soonest</option>
          <option value="priceLow">Price: low to high</option>
          <option value="priceHigh">Price: high to low</option>
        </select>
      </motion.div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#2e2e2e] border-t-[#555] rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-32">
          <p className="text-[#888] text-base font-medium">No auctions found</p>
          <p className="text-[#999] text-[13px] mt-2">Try a different search term</p>
        </div>
      )}

      {/* Auction grid */}
      {!isLoading && sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sorted.map((auction, i) => {
            const isClosed   = auction.status === 'closed';
            const currentBid = auction.currentHighestBid ?? auction.startingPrice;

            return (
              <motion.div
                key={auction._id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                className={`group relative bg-[#111] rounded-xl overflow-hidden flex flex-col
                            border transition-all duration-200
                            ${isClosed
                              ? 'border-[#2e2e2e] opacity-55'
                              : 'border-[#2e2e2e] hover:border-[#2e2e2e] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]'}`}
              >
                {/* Image */}
                <div className="h-44 bg-[#1a1a1a] flex items-center justify-center overflow-hidden relative">
                  <AuctionImage src={toAssetUrl(auction.images?.[0])} alt={auction.title} />

                  {/* Bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-16
                                  bg-gradient-to-t from-[#0e0e0e] to-transparent" />

                  {/* Badges */}
                  {isClosed ? (
                    <span className="absolute top-2.5 right-2.5 text-[9px] font-semibold uppercase
                                     tracking-[0.08em] bg-[#1a1a1a]/90 text-[#999] border border-[#2e2e2e]
                                     px-2 py-0.5 rounded backdrop-blur-sm">
                      Ended
                    </span>
                  ) : (
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      {auction.category && (
                        <span className="text-[9px] font-semibold uppercase tracking-[0.08em]
                                         bg-[#1a1a1a]/90 text-[#888] border border-[#2e2e2e]
                                         px-2 py-0.5 rounded backdrop-blur-sm">
                          {auction.category}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1.5 bg-[#1a1a1a]/90 border
                                      border-emerald-500/20 px-2 py-0.5 rounded backdrop-blur-sm">
                        <span className="live-dot" style={{ width: 5, height: 5 }} />
                        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                          Live
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-semibold text-[#e0e0e0] text-[13px] leading-snug
                                 line-clamp-2 tracking-[-0.01em] mb-3">
                    {auction.title}
                  </h2>

                  {/* Price row */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-[#888] uppercase tracking-[0.08em] mb-0.5">
                        Current bid
                      </p>
                      <p className="text-base font-bold text-white tracking-[-0.02em]">
                        {formatAmount(currentBid)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#999] uppercase tracking-[0.08em] mb-0.5">
                        Start
                      </p>
                      <p className="text-[12px] text-[#888] font-medium">
                        {formatAmount(auction.startingPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="mb-4">
                    <CountdownTimer endTime={auction.endTime} compact />
                  </div>

                  {/* CTA */}
                  <div className="mt-auto">
                    {isClosed ? (
                      <Link
                        to={`/auctions/${auction._id}`}
                        className="block w-full text-center py-2 rounded-lg text-[12px] font-medium
                                   text-[#999] border border-[#2e2e2e] hover:text-[#888]
                                   hover:border-[#2e2e2e] transition-all duration-150"
                      >
                        View Results
                      </Link>
                    ) : (
                      <Link
                        to={`/auctions/${auction._id}`}
                        className="block w-full text-center py-2 rounded-lg text-[12px] font-semibold
                                   bg-white text-[#080808] hover:bg-[#e8e8e8] active:scale-[0.98]
                                   transition-all duration-150"
                      >
                        Enter Auction
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
