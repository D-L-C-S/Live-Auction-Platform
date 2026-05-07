import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAuctions } from '../services/api';
import CountdownTimer from '../components/CountdownTimer/CountdownTimer';

function formatAmount(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function AuctionImage({ src, alt }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-gray-600">No image</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setError(true)} />;
}

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
          Live Auctions
        </h1>
        <p className="text-gray-500 text-sm mt-1">Browse active listings and place your bids</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or category…"
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
          <option value="endingSoon">Sort: Ending Soonest</option>
          <option value="priceLow">Sort: Price Low → High</option>
          <option value="priceHigh">Sort: Price High → Low</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-[#2a2a3d] border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-24 text-gray-600">
          <p className="text-lg font-medium text-gray-400">No auctions found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((auction) => {
            const isClosed   = auction.status === 'closed';
            const currentBid = auction.currentHighestBid ?? auction.startingPrice;

            return (
              <div
                key={auction._id}
                className={`bg-[#161622] border rounded-2xl overflow-hidden flex flex-col hover-lift
                  ${isClosed ? 'border-[#2a2a3d] opacity-60' : 'border-[#2a2a3d]'}`}
              >
                {/* Image */}
                <div className="h-44 bg-[#1e1e2e] flex items-center justify-center overflow-hidden relative group">
                  <AuctionImage src={auction.images?.[0]} alt={auction.title} />

                  {/* Hover overlay */}
                  {!isClosed && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  )}

                  {isClosed ? (
                    <span className="absolute top-2 right-2 bg-gray-700/90 backdrop-blur-sm text-gray-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Closed
                    </span>
                  ) : auction.category ? (
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                      {auction.category}
                    </span>
                  ) : null}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-semibold text-gray-100 text-sm leading-snug line-clamp-2">
                    {auction.title}
                  </h2>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Starting price</span>
                      <span className="font-medium text-gray-400">{formatAmount(auction.startingPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Current bid</span>
                      <span className="font-bold text-violet-400">{formatAmount(currentBid)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-xs text-gray-600 shrink-0">Ends:</span>
                    <CountdownTimer endTime={auction.endTime} />
                  </div>

                  <div className="mt-4">
                    {isClosed ? (
                      <Link
                        to={`/auctions/${auction._id}`}
                        className="block w-full text-center bg-[#1e1e2e] border border-[#2a2a3d] text-gray-400 font-semibold py-2 rounded-xl text-sm hover:bg-[#252535] hover:text-gray-300 transition-all duration-150"
                      >
                        View Results
                      </Link>
                    ) : (
                      <Link
                        to={`/auctions/${auction._id}`}
                        className="btn-gradient block w-full text-center py-2 rounded-xl text-sm"
                      >
                        Enter Auction →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
