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
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setError(true)} />;
}

export default function AuctionListingPage() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('endingSoon');

  useEffect(() => {
    fetchAuctions()
      .then(setAuctions)
      .finally(() => setIsLoading(false));
  }, []);

  // Filter by search term against title and category
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return auctions;
    return auctions.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        (a.category || '').toLowerCase().includes(term)
    );
  }, [auctions, searchTerm]);

  // Sort active auctions by selected option, then append closed ones at the end
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
        <h1 className="text-3xl font-bold text-gray-900">Live Auctions</h1>
        <p className="text-gray-500 text-sm mt-1">Browse active listings and place your bids</p>
      </div>

      {/* Search + Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search by title or category…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="endingSoon">Sort: Ending Soonest</option>
          <option value="priceLow">Sort: Price Low → High</option>
          <option value="priceHigh">Sort: Price High → Low</option>
        </select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No auctions found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {/* Auction cards grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((auction) => {
            const isClosed = auction.status === 'closed';
            const currentBid = auction.currentHighestBid ?? auction.startingPrice;

            return (
              <div
                key={auction._id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
                  isClosed ? 'opacity-70 border-gray-200' : 'border-gray-200'
                }`}
              >
                {/* Image placeholder */}
                <div className="h-44 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  <AuctionImage src={auction.images?.[0]} alt={auction.title} />
                  {isClosed && (
                    <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Closed
                    </span>
                  )}
                  {auction.category && !isClosed && (
                    <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {auction.category}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {auction.title}
                  </h2>

                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Starting price</span>
                      <span className="font-medium text-gray-700">{formatAmount(auction.startingPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Current bid</span>
                      <span className="font-bold text-blue-600">{formatAmount(currentBid)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1">
                    <span className="text-xs text-gray-500 shrink-0">Ends:</span>
                    <CountdownTimer endTime={auction.endTime} />
                  </div>

                  <div className="mt-4">
                    {isClosed ? (
                      <Link
                        to={`/auctions/${auction._id}`}
                        className="block w-full text-center bg-gray-200 text-gray-600 font-semibold py-2 rounded-xl text-sm hover:bg-gray-300 transition-colors"
                      >
                        View Results
                      </Link>
                    ) : (
                      <Link
                        to={`/auctions/${auction._id}`}
                        className="block w-full text-center bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm hover:bg-blue-700 transition-colors"
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
