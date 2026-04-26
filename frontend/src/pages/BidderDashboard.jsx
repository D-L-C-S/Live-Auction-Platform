import React, { useState, useEffect } from 'react';

export default function BidderDashboard() {
  // In a real app, you'd get this from your AuthContext or login state
  const mockUserId = "user_123"; 

  const [activeBids, setActiveBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This is the function that will fetch your real data once the backend is ready
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        /* // UNCOMMENT THIS WHEN BACKEND IS READY
        const response = await fetch(`/api/bidders/${mockUserId}/dashboard`);
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();
        setActiveBids(data.activeBids);
        setWonAuctions(data.wonAuctions);
        */

        // MOCK DATA: Delete this block once the real fetch above is uncommented
        setTimeout(() => {
          setActiveBids([
            { _id: 'auc_1', title: 'MacBook Pro M3', currentHighestBid: 1800, myMaxBid: 2000, endTime: '2026-05-01T15:00:00Z' }
          ]);
          setWonAuctions([
            { _id: 'auc_2', title: 'Sony A7IV Camera', finalAmount: 2100, escrowStatus: 'held' }
          ]);
          setLoading(false);
        }, 800); // Faking network delay

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleConfirmDelivery = async (auctionId) => {
    // Prevent double-clicking
    if (!window.confirm("Are you sure you received the item? This will release funds to the seller.")) return;

    try {
      /*
      // UNCOMMENT THIS WHEN BACKEND IS READY
      // buyerId is intentionally omitted — backend must derive buyer identity from the JWT, not request body
      const response = await fetch('/api/escrow/confirm-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ auctionId })
      });
      if (!response.ok) throw new Error("Delivery confirmation failed");
      */

      // Optimistically update the UI so the user sees the change instantly
      setWonAuctions((prevAuctions) => 
        prevAuctions.map((auction) => 
          auction._id === auctionId ? { ...auction, escrowStatus: 'released' } : auction
        )
      );
      
      alert("Success! Funds have been released from escrow.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">Error loading dashboard: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Bidding Dashboard</h1>

      {/* Active Bids Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-6">Active Bids</h2>
        {activeBids.length === 0 ? (
          <p className="text-gray-500 italic">You don't have any active bids right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBids.map((bid) => (
              <div key={bid._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 truncate">{bid.title}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Current Highest:</span>
                  <span className="text-lg font-semibold text-gray-900">${bid.currentHighestBid}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Your Proxy Max:</span>
                  <span className="text-sm font-medium text-green-600">${bid.myMaxBid}</span>
                </div>
                <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                  Closes: {new Date(bid.endTime).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Won Auctions Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-6">Won Auctions & Escrow</h2>
        {wonAuctions.length === 0 ? (
          <p className="text-gray-500 italic">You haven't won any auctions yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wonAuctions.map((auction) => (
              <div key={auction._id} className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md border border-blue-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 truncate">{auction.title}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Final Price:</span>
                  <span className="text-lg font-bold text-gray-900">${auction.finalAmount}</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                    auction.escrowStatus === 'held' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {auction.escrowStatus}
                  </span>
                </div>

                {auction.escrowStatus === 'held' ? (
                  <button 
                    onClick={() => handleConfirmDelivery(auction._id)}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Confirm Item Received
                  </button>
                ) : (
                  <a 
                    href={`/jsp/payment-receipt.jsp?auctionId=${auction._id}`} 
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    View Official Receipt
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}