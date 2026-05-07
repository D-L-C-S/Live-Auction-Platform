import React, { useState, useEffect } from 'react';

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function escrowBadgeClass(status) {
  if (status === 'held')     return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  if (status === 'released') return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  return 'bg-gray-500/15 text-gray-400 border border-gray-500/30';
}

export default function BidderDashboard() {
  const [activeBids,   setActiveBids]   = useState([]);
  const [wonAuctions,  setWonAuctions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token    = localStorage.getItem('token');
        const response = await fetch('/api/bidders/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        setActiveBids(data.activeBids);
        setWonAuctions(data.wonAuctions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleConfirmDelivery = async (auctionId) => {
    if (!globalThis.confirm('Are you sure you received the item? This will release funds to the seller.')) return;
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch('/api/escrow/confirm-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ auctionId }),
      });
      if (!response.ok) throw new Error('Delivery confirmation failed');
      setWonAuctions((prev) =>
        prev.map((auction) =>
          auction._id === auctionId ? { ...auction, escrowStatus: 'released' } : auction
        )
      );
      alert('Success! Funds have been released from escrow.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0d0d14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#2a2a3d] border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-16">
        <p className="text-red-400 text-sm">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
          My Bidding Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">Track your active bids and won auctions</p>
      </div>

      {/* Active Bids */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-gray-100">Active Bids</h2>
          {activeBids.length > 0 && (
            <span className="bg-violet-500/20 text-violet-400 border border-violet-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeBids.length}
            </span>
          )}
        </div>

        {activeBids.length === 0 ? (
          <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl px-6 py-10 text-center">
            <p className="text-gray-500 text-sm">You don&apos;t have any active bids right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeBids.map((bid) => (
              <div
                key={bid._id}
                className="bg-[#161622] border border-[#2a2a3d] rounded-2xl p-5 hover-lift group"
              >
                {/* Live indicator */}
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>

                <h3 className="text-sm font-bold text-gray-100 mb-4 truncate group-hover:text-violet-300 transition-colors">
                  {bid.title}
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Current Highest</span>
                    <span className="text-sm font-bold text-gray-100">{fmt(bid.currentHighestBid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Your Proxy Max</span>
                    <span className="text-sm font-semibold text-violet-400">
                      {bid.myMaxBid == null ? '—' : fmt(bid.myMaxBid)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-700 bg-[#1e1e2e] rounded-lg px-3 py-2">
                  Closes: {new Date(bid.endTime).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Won Auctions & Escrow */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-gray-100">Won Auctions &amp; Escrow</h2>
          {wonAuctions.length > 0 && (
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
              {wonAuctions.length}
            </span>
          )}
        </div>

        {wonAuctions.length === 0 ? (
          <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl px-6 py-10 text-center">
            <p className="text-gray-500 text-sm">You haven&apos;t won any auctions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wonAuctions.map((auction) => (
              <div
                key={auction._id}
                className="bg-gradient-to-br from-[#1a1535] to-[#161622] border border-violet-500/20 rounded-2xl p-5 hover-lift"
              >
                {/* Trophy */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-amber-400 text-lg">🏆</span>
                  <span className="text-xs text-amber-400 font-semibold uppercase tracking-wide">Won</span>
                </div>

                <h3 className="text-sm font-bold text-gray-100 mb-4 truncate">{auction.title}</h3>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Final Price</span>
                    <span className="text-base font-bold text-gray-100">{fmt(auction.finalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Escrow Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${escrowBadgeClass(auction.escrowStatus)}`}>
                      {auction.escrowStatus}
                    </span>
                  </div>
                </div>

                {auction.escrowStatus === 'held' ? (
                  <button
                    onClick={() => handleConfirmDelivery(auction._id)}
                    className="btn-gradient w-full py-2 rounded-xl text-sm"
                  >
                    Confirm Item Received
                  </button>
                ) : (
                  <a
                    href={`/jsp/auction-certificate.jsp?auctionId=${auction._id}`}
                    className="w-full flex justify-center py-2 px-4 border border-[#2a2a3d] rounded-xl text-sm font-medium text-gray-400 hover:bg-[#1e1e2e] hover:text-gray-300 hover:border-[#3a3a5c] transition-all duration-150"
                  >
                    View Official Certificate
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
