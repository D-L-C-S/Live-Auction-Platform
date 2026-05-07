import React, { useEffect, useRef, useState } from 'react';
import CountdownTimer from '../CountdownTimer/CountdownTimer';
import BidFeed from '../BidFeed/BidFeed';
import BiddingForm from '../BiddingForm/BiddingForm';
import { placeBid, placeProxyBid } from '../../services/api';

function formatAmount(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function AuctionRoom({ auction, socket, currentUserId }) {
  const [bids, setBids] = useState(() => {
    if (auction.currentHighestBid && auction.currentHighestBidder) {
      return [{
        _id:       'seed',
        bidder:    auction.currentHighestBidder,
        amount:    auction.currentHighestBid,
        placedAt:  auction.updatedAt || auction.startTime,
      }];
    }
    return [];
  });

  const [currentHighestBid,    setCurrentHighestBid]    = useState(auction.currentHighestBid);
  const [currentHighestBidder, setCurrentHighestBidder] = useState(auction.currentHighestBidder);
  const [isClosed,             setIsClosed]             = useState(auction.status === 'closed');
  const [winner,               setWinner]               = useState(auction.winner || auction.currentHighestBidder);
  const [finalAmount,          setFinalAmount]          = useState(
    auction.status === 'closed' ? auction.currentHighestBid : null
  );
  const [reserveMet,  setReserveMet]  = useState(auction.status !== 'closed' || !!auction.winner);
  const [outbidAlert, setOutbidAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidError,    setBidError]    = useState('');
  const outbidTimer = useRef(null);

  useEffect(() => {
    const fetchBidHistory = async () => {
      try {
        const response = await fetch(`/api/bids/${auction._id}`);
        if (!response.ok) throw new Error("Failed to fetch history");
        const historyData = await response.json();
        if (historyData && historyData.length > 0) {
          setBids(historyData.map(bid => ({
            _id:      bid._id,
            bidder:   bid.bidder,
            amount:   bid.amount,
            placedAt: bid.createdAt || bid.timestamp,
          })));
        }
      } catch (error) {
        console.error("Error loading bid history:", error);
      }
    };
    fetchBidHistory();
  }, [auction._id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', auction._id);

    function handleNewBid(data) {
      if (data.auctionId !== auction._id) return;
      if (String(data.bidder) === String(currentUserId)) return;
      setBids((prev) => [{ _id: data.bidId, bidder: data.bidder, amount: data.amount, placedAt: data.placedAt }, ...prev]);
      setCurrentHighestBid(data.amount);
      setCurrentHighestBidder(data.bidder);
    }

    function handleOutbid(data) {
      if (data.auctionId !== auction._id) return;
      if (String(data.outbidUserId) === String(currentUserId)) {
        setOutbidAlert(true);
        clearTimeout(outbidTimer.current);
        outbidTimer.current = setTimeout(() => setOutbidAlert(false), 5000);
      }
    }

    function handleAuctionClosed(data) {
      if (data.auctionId !== auction._id) return;
      setIsClosed(true);
      setReserveMet(data.reserveMet !== false);
      if (data.winnerId)      setWinner({ _id: data.winnerId });
      if (data.finalAmount != null) setFinalAmount(data.finalAmount);
    }

    socket.on('new_bid',        handleNewBid);
    socket.on('outbid',         handleOutbid);
    socket.on('auction_closed', handleAuctionClosed);

    return () => {
      socket.emit('leave_room', auction._id);
      socket.off('new_bid',        handleNewBid);
      socket.off('outbid',         handleOutbid);
      socket.off('auction_closed', handleAuctionClosed);
      clearTimeout(outbidTimer.current);
    };
  }, [socket, auction._id, currentUserId]);

  function handleExpired() {
    setIsClosed(true);
    const met = !auction.reservePrice || (currentHighestBid != null && currentHighestBid >= auction.reservePrice);
    setReserveMet(met);
    if (met) {
      setWinner(currentHighestBidder);
      setFinalAmount(currentHighestBid);
    }
  }

  async function handlePlaceBid(amount, proxyMax) {
    setBidError('');
    setIsSubmitting(true);
    try {
      if (proxyMax) {
        await placeProxyBid(auction._id, proxyMax);
      } else {
        await placeBid(auction._id, amount);
      }
      setBids((prev) => [{
        _id:      `local-${Date.now()}`,
        bidder:   { _id: currentUserId, name: 'You' },
        amount,
        placedAt: new Date().toISOString(),
      }, ...prev]);
      setCurrentHighestBid(amount);
      setCurrentHighestBidder({ _id: currentUserId, name: 'You' });
    } catch (err) {
      setBidError(err?.response?.data?.message || 'Failed to place bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const [imgError, setImgError] = useState(false);
  const imageUrl = !imgError && auction.images?.[0];

  const isSeller = String(auction.seller?._id || auction.seller) === String(currentUserId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Outbid toast */}
      {outbidAlert && (
        <div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-orange-600 to-red-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-orange-500/30 font-semibold text-sm flex items-center gap-2 animate-slide-down">
          <span>⚡</span>
          You&apos;ve been outbid! Place a higher bid to stay in.
        </div>
      )}

      {/* Auction closed banner */}
      {isClosed && (
        <div className={`mb-6 text-white rounded-2xl px-6 py-5 text-center shadow-xl animate-fade-in
          ${reserveMet
            ? 'bg-gradient-to-r from-violet-700 via-purple-700 to-blue-700 shadow-violet-500/20'
            : 'bg-gradient-to-r from-gray-700 to-gray-600'}`}
        >
          <p className="text-lg font-bold">Auction Closed</p>
          {reserveMet && winner && (
            <p className="text-sm mt-1 opacity-90">
              Winner: <span className="font-semibold">{winner.name || winner._id || String(winner)}</span>
              {finalAmount && (
                <span> — Final bid: <span className="font-semibold">{formatAmount(finalAmount)}</span></span>
              )}
            </p>
          )}
          {!reserveMet && (
            <p className="text-sm mt-1 opacity-90">Reserve price not met — item will not be sold.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — item details */}
        <div className="space-y-5">
          {/* Image */}
          <div className="w-full h-64 bg-[#1e1e2e] rounded-2xl overflow-hidden flex items-center justify-center border border-[#2a2a3d]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={auction.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm mt-2 text-gray-600">No image available</span>
              </div>
            )}
          </div>

          {/* Title & meta */}
          <div>
            {auction.category && (
              <span className="inline-block bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                {auction.category}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-100">{auction.title}</h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">{auction.description}</p>
          </div>

          {/* Price boxes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1e1e2e] border border-[#2a2a3d] rounded-xl p-4 hover:border-[#3a3a5c] transition-colors">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Starting Price</p>
              <p className="text-xl font-bold text-gray-300">{formatAmount(auction.startingPrice)}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-violet-500/30 rounded-xl p-4 animate-pulse-glow">
              <p className="text-xs text-violet-400 font-medium uppercase tracking-wide mb-1">Current Highest Bid</p>
              <p className="text-xl font-bold text-violet-300">
                {currentHighestBid ? formatAmount(currentHighestBid) : formatAmount(auction.startingPrice)}
              </p>
            </div>
          </div>

          {/* Reserve price (seller only) */}
          {isSeller && auction.reservePrice && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-500 font-medium uppercase tracking-wide">Reserve Price</p>
                <p className="text-base font-bold text-amber-400 mt-0.5">{formatAmount(auction.reservePrice)}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                currentHighestBid >= auction.reservePrice
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/30'
              }`}>
                {currentHighestBid >= auction.reservePrice ? 'Reserve met' : 'Reserve not met'}
              </span>
            </div>
          )}

          {/* Current leader */}
          {currentHighestBidder && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-xs text-emerald-500 font-medium">Current Leader</p>
                <p className="text-sm font-semibold text-gray-200">
                  {currentHighestBidder.name || currentHighestBidder._id || String(currentHighestBidder)}
                </p>
              </div>
            </div>
          )}

          {/* Countdown */}
          <div className="flex items-center gap-3 bg-[#1e1e2e] border border-[#2a2a3d] rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-gray-500">Time Remaining:</span>
            <CountdownTimer endTime={auction.endTime} onExpired={handleExpired} />
          </div>
        </div>

        {/* RIGHT — bid feed + form */}
        <div className="space-y-5">
          <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-200">Live Bid History</h2>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <BidFeed
              bids={bids}
              isSeller={isSeller}
            />
          </div>

          <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-200 mb-4">Place a Bid</h2>
            {isSeller ? (
              <div className="bg-[#1e1e2e] border border-[#2a2a3d] rounded-xl p-5 text-center text-sm text-gray-500">
                You are the seller of this item.
              </div>
            ) : (
              <>
                {bidError && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-400 text-sm animate-slide-down">
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
