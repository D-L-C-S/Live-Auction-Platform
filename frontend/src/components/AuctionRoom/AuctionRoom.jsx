import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountdownTimer from '../CountdownTimer/CountdownTimer';
import BidFeed from '../BidFeed/BidFeed';
import BiddingForm from '../BiddingForm/BiddingForm';
import { apiFetch, toAssetUrl, placeBid, placeProxyBid, closeAuction, cancelAuction } from '../../services/api';

function formatAmount(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function AuctionRoom({ auction, socket, currentUserId }) {
  const [bids, setBids] = useState(() => {
    if (auction.currentHighestBid && auction.currentHighestBidder) {
      return [{
        _id:      'seed',
        bidder:   auction.currentHighestBidder,
        amount:   auction.currentHighestBid,
        placedAt: auction.updatedAt || auction.startTime,
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
  const [reserveMet,    setReserveMet]    = useState(auction.status !== 'closed' || !!auction.winner);
  const [isCancelled,   setIsCancelled]   = useState(auction.status === 'cancelled');
  const [outbidAlert,   setOutbidAlert]   = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [bidError,      setBidError]      = useState('');
  const [actionLoading, setActionLoading] = useState(null); // 'close' | 'cancel'
  const outbidTimer = useRef(null);

  useEffect(() => {
    const fetchBidHistory = async () => {
      try {
        const response = await apiFetch(`/api/bids/${auction._id}`);
        if (!response.ok) throw new Error('Failed to fetch history');
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
        console.error('Error loading bid history:', error);
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
      if (data.winnerId)            setWinner({ _id: data.winnerId });
      if (data.finalAmount != null) setFinalAmount(data.finalAmount);
    }

    function handleAuctionCancelled(data) {
      if (data.auctionId !== auction._id) return;
      setIsCancelled(true);
      setIsClosed(true);
    }

    socket.on('new_bid',           handleNewBid);
    socket.on('outbid',            handleOutbid);
    socket.on('auction_closed',    handleAuctionClosed);
    socket.on('auction_cancelled', handleAuctionCancelled);

    return () => {
      socket.emit('leave_room', auction._id);
      socket.off('new_bid',           handleNewBid);
      socket.off('outbid',            handleOutbid);
      socket.off('auction_closed',    handleAuctionClosed);
      socket.off('auction_cancelled', handleAuctionCancelled);
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

  async function handleClose() {
    if (!globalThis.confirm('End this auction now? The highest bidder will be declared the winner.')) return;
    setActionLoading('close');
    try {
      await closeAuction(auction._id);
      // UI update arrives via auction_closed socket event
    } catch (err) {
      alert('Failed to end auction: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    if (!globalThis.confirm('Cancel this auction? All bids will be voided and no winner will be selected.')) return;
    setActionLoading('cancel');
    try {
      await cancelAuction(auction._id);
      // UI update arrives via auction_cancelled socket event
    } catch (err) {
      alert('Failed to cancel auction: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
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
  const imageUrl = !imgError && toAssetUrl(auction.images?.[0]);
  const isSeller = String(auction.seller?._id || auction.seller) === String(currentUserId);

  const bannerBorder   = isCancelled ? 'border-red-500/20' : reserveMet ? 'border-emerald-500/20' : 'border-[#2e2e2e]';
  const bannerHeading  = isCancelled ? 'Auction Cancelled' : reserveMet ? 'Auction Closed — Sold' : 'Auction Closed — Reserve Not Met';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Outbid toast */}
      <AnimatePresence>
        {outbidAlert && (
          <motion.div
            initial={{ opacity: 0, x: 40, y: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 right-6 z-50 bg-[#1a1a1a] border border-amber-500/25
                       text-[#f0f0f0] px-5 py-3.5 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.7)]
                       text-[13px] font-semibold flex items-center gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            You've been outbid — place a higher bid to lead.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auction closed / cancelled banner */}
      <AnimatePresence>
        {isClosed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 border rounded-xl px-6 py-5 bg-[#111] ${bannerBorder}`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#999] mb-1">
                  Auction Status
                </p>
                <p className="text-lg font-bold tracking-[-0.02em] text-white">
                  {bannerHeading}
                </p>
                {!isCancelled && reserveMet && winner && (
                  <p className="text-[13px] text-[#888] mt-1">
                    Winner:{' '}
                    <span className="text-white font-semibold">
                      {winner.name || winner._id || String(winner)}
                    </span>
                    {finalAmount && (
                      <>
                        {' '}·{' '}
                        <span className="text-white font-semibold">{formatAmount(finalAmount)}</span>
                      </>
                    )}
                  </p>
                )}
                {!isCancelled && !reserveMet && (
                  <p className="text-[13px] text-[#999] mt-1">
                    The reserve price was not met. Item will not be sold.
                  </p>
                )}
                {isCancelled && (
                  <p className="text-[13px] text-[#999] mt-1">
                    This auction was cancelled by the seller. All bids have been voided.
                  </p>
                )}
              </div>
              {!isCancelled && reserveMet && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400
                                 border border-emerald-500/20 text-[11px] font-semibold uppercase
                                 tracking-[0.08em] px-3 py-1.5 rounded-lg shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Sold
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400
                                 border border-red-500/20 text-[11px] font-semibold uppercase
                                 tracking-[0.08em] px-3 py-1.5 rounded-lg shrink-0">
                  Cancelled
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

        {/* LEFT — item details */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          {/* Image */}
          <div className="w-full aspect-[16/10] bg-[#111] rounded-xl overflow-hidden
                          border border-[#2e2e2e] relative group">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={auction.title}
                className="w-full h-full object-cover transition-transform duration-500
                           group-hover:scale-[1.02]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#2a2a2a]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[12px] text-[#999] mt-3">No image</span>
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div>
            {auction.category && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.1em]
                               text-[#888] border border-[#2e2e2e] px-2.5 py-1 rounded mb-3">
                {auction.category}
              </span>
            )}
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-white leading-tight">
              {auction.title}
            </h1>
            <p className="text-[14px] text-[#888] mt-2.5 leading-relaxed">
              {auction.description}
            </p>
          </div>

          {/* Price display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111] border border-[#2e2e2e] rounded-xl p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#888] mb-1.5">
                Starting Price
              </p>
              <p className="text-lg font-bold text-[#888] tracking-[-0.02em]">
                {formatAmount(auction.startingPrice)}
              </p>
            </div>
            <div className={`bg-[#111] rounded-xl p-4 border transition-all
              ${isClosed
                ? 'border-[#2e2e2e]'
                : 'border-cyan-400/15 animate-pulse-glow'}`}>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-cyan-400/70 mb-1.5">
                {isClosed ? 'Final Bid' : 'Current Bid'}
              </p>
              <p className="text-lg font-bold text-white tracking-[-0.02em]">
                {currentHighestBid ? formatAmount(currentHighestBid) : formatAmount(auction.startingPrice)}
              </p>
            </div>
          </div>

          {/* Reserve price (seller only) */}
          {isSeller && auction.reservePrice && (
            <div className="bg-[#111] border border-amber-500/20 rounded-xl px-4 py-3
                            flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-amber-500/70 mb-1">
                  Reserve Price
                </p>
                <p className="text-base font-bold text-amber-400 tracking-[-0.02em]">
                  {formatAmount(auction.reservePrice)}
                </p>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-lg border
                ${(currentHighestBid || 0) >= auction.reservePrice
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {(currentHighestBid || 0) >= auction.reservePrice ? 'Reserve met' : 'Reserve not met'}
              </span>
            </div>
          )}

          {/* Current leader */}
          {currentHighestBidder && !isClosed && (
            <div className="flex items-center gap-3 bg-[#111] border border-[#2e2e2e]
                            rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/20
                              flex items-center justify-center shrink-0">
                <span className="text-cyan-400 text-[11px] font-bold">
                  {(currentHighestBidder.name || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#888]">
                  Leading Bidder
                </p>
                <p className="text-[13px] font-semibold text-[#e0e0e0]">
                  {currentHighestBidder.name || currentHighestBidder._id || String(currentHighestBidder)}
                </p>
              </div>
            </div>
          )}

          {/* Countdown */}
          {!isClosed && (
            <div className="bg-[#111] border border-[#2e2e2e] rounded-xl px-5 py-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#888] mb-3">
                Time Remaining
              </p>
              <CountdownTimer endTime={auction.endTime} onExpired={handleExpired} />
            </div>
          )}
        </motion.div>

        {/* RIGHT — bid feed + form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Live bid history */}
          <div className="bg-[#111] border border-[#2e2e2e] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">
                Bid History
              </h2>
              {!isClosed && (
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="text-[11px] font-medium text-emerald-400">Live</span>
                </div>
              )}
            </div>
            <BidFeed bids={bids} isSeller={isSeller} />
          </div>

          {/* Bidding form */}
          <div className="bg-[#111] border border-[#2e2e2e] rounded-xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888] mb-4">
              {isSeller ? 'Your Listing' : 'Place a Bid'}
            </h2>

            {isSeller ? (
              <div className="space-y-3">
                {!isClosed ? (
                  <>
                    <button
                      onClick={handleClose}
                      disabled={!!actionLoading}
                      className="w-full py-2.5 bg-white text-[#080808] rounded-xl text-[12px]
                                 font-semibold hover:bg-[#e8e8e8] active:scale-[0.98]
                                 transition-all duration-150 disabled:opacity-40
                                 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'close' ? 'Ending…' : 'End Auction'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={!!actionLoading}
                      className="w-full py-2.5 border border-red-500/25 text-red-400 rounded-xl
                                 text-[12px] font-semibold hover:bg-red-500/10
                                 hover:border-red-500/40 active:scale-[0.98]
                                 transition-all duration-150 disabled:opacity-40
                                 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'cancel' ? 'Cancelling…' : 'Cancel Auction'}
                    </button>
                  </>
                ) : (
                  <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg p-4 text-center">
                    <p className="text-[#999] text-[13px]">
                      {isCancelled ? 'This auction has been cancelled.' : 'This auction is closed.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {bidError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-4 bg-red-500/8 border border-red-500/20 rounded-lg
                                 px-4 py-3 text-red-400 text-[13px]"
                    >
                      {bidError}
                    </motion.div>
                  )}
                </AnimatePresence>
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
        </motion.div>

      </div>
    </div>
  );
}
