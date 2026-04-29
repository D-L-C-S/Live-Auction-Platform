import React, { useEffect, useRef, useState } from 'react';
import CountdownTimer from '../CountdownTimer/CountdownTimer';
import BidFeed from '../BidFeed/BidFeed';
import BiddingForm from '../BiddingForm/BiddingForm';
import { placeBid } from '../../services/api';

function formatAmount(n) {
  if (n == null) return '—';
  return '$' + Number(n).toLocaleString('en-US');
}

// Props:
//   auction — auction object from API or mock
//   socket  — socket.io-client instance (may be null if not yet connected)
//   currentUserId — MongoDB _id of the logged-in user, from AuthContext
export default function AuctionRoom({ auction, socket, currentUserId }) {
  const [bids, setBids] = useState(() => {
    // Seed the feed with the existing highest bid if one exists
    if (auction.currentHighestBid && auction.currentHighestBidder) {
      return [
        {
          _id: 'seed',
          bidder: auction.currentHighestBidder,
          amount: auction.currentHighestBid,
          placedAt: auction.updatedAt || auction.startTime,
        },
      ];
    }
    return [];
  });

  const [currentHighestBid, setCurrentHighestBid] = useState(auction.currentHighestBid);
  const [currentHighestBidder, setCurrentHighestBidder] = useState(auction.currentHighestBidder);
  const [isClosed, setIsClosed] = useState(auction.status === 'closed');
  const [winner, setWinner] = useState(auction.winner || auction.currentHighestBidder);
  const [finalAmount, setFinalAmount] = useState(
    auction.status === 'closed' ? auction.currentHighestBid : null
  );
  const [outbidAlert, setOutbidAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');
  const outbidTimer = useRef(null);

  //fetch existing bid history on loading this
  useEffect(() => {
    const fetchBidHistory = async () => {
      try {
        const response = await fetch(`/api/bids/${auction._id}`);
        if (!response.ok) throw new Error("Failed to fetch history");
        
        const historyData = await response.json();
        
        if (historyData && historyData.length > 0) {
          // Format the backend data to perfectly match Charan's UI structure
          const formattedHistory = historyData.map(bid => ({
            _id: bid._id,
            bidder: bid.bidder, // Keep as-is so Charan's logic handles object vs string
            amount: bid.amount,
            placedAt: bid.createdAt || bid.timestamp 
          }));
          
          setBids(formattedHistory);
        }
      } catch (error) {
        console.error("Error loading bid history:", error);
      }
    };

    fetchBidHistory();
  }, [auction._id]);
  

  // Join auction socket room and wire up real-time events
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', auction._id);

    function handleNewBid(data) {
      if (data.auctionId !== auction._id) return;
      // Skip echo of our own bid — already added optimistically in handlePlaceBid
      if (String(data.bidder) === String(currentUserId)) return;
      const entry = {
        _id: data.bidId,
        bidder: data.bidder,
        amount: data.amount,
        placedAt: data.placedAt,
      };
      setBids((prev) => [entry, ...prev]);
      setCurrentHighestBid(data.amount);
      setCurrentHighestBidder(data.bidder);
    }

    function handleOutbid(data) {
      if (data.auctionId !== auction._id) return;
      // Only show the toast to the user who was outbid
      if (String(data.outbidUserId) === String(currentUserId)) {
        setOutbidAlert(true);
        clearTimeout(outbidTimer.current);
        outbidTimer.current = setTimeout(() => setOutbidAlert(false), 5000);
      }
    }

    function handleAuctionClosed(data) {
      if (data.auctionId !== auction._id) return;
      setIsClosed(true);
      if (data.winnerId) setWinner({ _id: data.winnerId });
      if (data.finalAmount != null) setFinalAmount(data.finalAmount);
    }

    socket.on('new_bid', handleNewBid);
    socket.on('outbid', handleOutbid);
    socket.on('auction_closed', handleAuctionClosed);

    return () => {
      socket.emit('leave_room', auction._id);
      socket.off('new_bid', handleNewBid);
      socket.off('outbid', handleOutbid);
      socket.off('auction_closed', handleAuctionClosed);
      clearTimeout(outbidTimer.current);
    };
  }, [socket, auction._id, currentUserId]);

  function handleExpired() {
    setIsClosed(true);
    setWinner(currentHighestBidder);
    setFinalAmount(currentHighestBid);
  }

  async function handlePlaceBid(amount, proxyMax) {
    setBidError('');
    setIsSubmitting(true);
    try {
      await placeBid(auction._id, amount);
      // Optimistic update — real update comes via socket new_bid event
      const entry = {
        _id: `local-${Date.now()}`,
        bidder: { _id: currentUserId, name: 'You' },
        amount,
        placedAt: new Date().toISOString(),
      };
      setBids((prev) => [entry, ...prev]);
      setCurrentHighestBid(amount);
      setCurrentHighestBidder({ _id: currentUserId, name: 'You' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to place bid. Please try again.';
      setBidError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const imageUrl = auction.images?.[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Outbid toast */}
      {outbidAlert && (
        <div className="fixed top-6 right-6 z-50 bg-orange-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm flex items-center gap-2 animate-bounce">
          <span>⚡</span> You've been outbid! Place a higher bid to stay in.
        </div>
      )}

      {/* Auction closed / winner banner */}
      {isClosed && (
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl px-6 py-5 text-center shadow-lg">
          <p className="text-lg font-bold">Auction Closed</p>
          {winner && (
            <p className="text-sm mt-1 opacity-90">
              Winner: <span className="font-semibold">{winner.name || winner._id || String(winner)}</span>
              {finalAmount && (
                <span> — Final bid: <span className="font-semibold">{formatAmount(finalAmount)}</span></span>
              )}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — item details */}
        <div className="space-y-6">
          {/* Image */}
          <div className="w-full h-64 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={auction.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm mt-2">No image available</span>
              </div>
            )}
          </div>

          {/* Title & meta */}
          <div>
            {auction.category && (
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full mb-2">
                {auction.category}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{auction.title}</h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">{auction.description}</p>
          </div>

          {/* Price info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Starting Price</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{formatAmount(auction.startingPrice)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Current Highest Bid</p>
              <p className="text-xl font-bold text-blue-700 mt-1">
                {currentHighestBid ? formatAmount(currentHighestBid) : formatAmount(auction.startingPrice)}
              </p>
            </div>
          </div>

          {/* Current leader */}
          {currentHighestBidder && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="text-green-600 text-lg">🏆</span>
              <div>
                <p className="text-xs text-green-600 font-medium">Current Leader</p>
                <p className="text-sm font-semibold text-gray-800">
                  {currentHighestBidder.name || currentHighestBidder._id || String(currentHighestBidder)}
                </p>
              </div>
            </div>
          )}

          {/* Countdown */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Time Remaining:</span>
            <CountdownTimer endTime={auction.endTime} onExpired={handleExpired} />
          </div>
        </div>

        {/* RIGHT — bid feed + bidding form */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Live Bid History</h2>
            <BidFeed bids={bids} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Place a Bid</h2>
            {bidError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm">
                {bidError}
              </div>
            )}
            <BiddingForm
              onPlaceBid={handlePlaceBid}
              disabled={isClosed}
              currentHighestBid={currentHighestBid}
              startingPrice={auction.startingPrice}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
