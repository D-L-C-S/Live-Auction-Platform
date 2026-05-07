import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import PaymentModal from '../components/PaymentModal/PaymentModal';
import { markPaymentHeld } from '../services/api';

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function escrowStatusStyle(status) {
  if (status === 'pending_payment') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  if (status === 'held')            return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  if (status === 'released')        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  return 'bg-[#1c1c1c] text-[#888] border-[#333]';
}

function escrowStatusLabel(status) {
  if (status === 'pending_payment') return 'awaiting payment';
  return status || 'pending';
}

function Counter({ value, prefix = '', suffix = '' }) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) =>
    prefix + Math.round(v).toLocaleString('en-IN') + suffix
  );
  useEffect(() => {
    const ctrl = animate(motionVal, value, { duration: 0.8, ease: 'easeOut' });
    return ctrl.stop;
  }, [value]);
  return <motion.span>{display}</motion.span>;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardAnim = {
  hidden:   { opacity: 0, y: 18 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function BidderDashboard() {
  const [activeBids,  setActiveBids]  = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [payingAuction, setPayingAuction] = useState(null); // { _id, title, finalAmount }

  useEffect(() => {
    (async () => {
      try {
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
    })();
  }, []);

  const handlePayNow = (auction) => {
    setPayingAuction(auction);
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    const auctionId = payingAuction._id;
    setPayingAuction(null);
    try {
      await markPaymentHeld(auctionId, paymentIntentId);
      setWonAuctions((prev) =>
        prev.map((a) =>
          a._id === auctionId
            ? { ...a, escrowStatus: 'held', stripePaymentIntentId: paymentIntentId }
            : a
        )
      );
    } catch (err) {
      alert('Payment succeeded but escrow update failed: ' + err.message);
    }
  };

  const handleConfirmDelivery = async (auction) => {
    if (!globalThis.confirm('Are you sure you received the item? This will release funds to the seller.')) return;
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch('/api/escrow/confirm-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ auctionId: auction._id }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delivery confirmation failed');
      }
      setWonAuctions((prev) =>
        prev.map((a) => a._id === auction._id ? { ...a, escrowStatus: 'released' } : a)
      );
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-[#888] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-[#888]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const totalPaid     = wonAuctions.filter((a) => a.escrowStatus === 'held' || a.escrowStatus === 'released').reduce((s, a) => s + (a.finalAmount || 0), 0);
  const totalSettled  = wonAuctions.filter((a) => a.escrowStatus === 'released').reduce((s, a) => s + (a.finalAmount || 0), 0);
  const settledCount  = wonAuctions.filter((a) => a.escrowStatus === 'released').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Payment modal */}
      {payingAuction && (
        <PaymentModal
          auctionId={payingAuction._id}
          amount={payingAuction.finalAmount}
          title={payingAuction.title}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPayingAuction(null)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666] mb-3">
          Overview
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
              My Bids
            </h1>
            <p className="text-[13px] text-[#888] mt-2">
              Track your active bids and won auctions
            </p>
          </div>
          <Link
            to="/auctions"
            className="shrink-0 text-[12px] font-semibold bg-white text-[#080808]
                       px-4 py-2 rounded-xl hover:bg-[#e8e8e8] active:scale-[0.98]
                       transition-all duration-150 mt-1"
          >
            Browse auctions →
          </Link>
        </div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-wrap items-center gap-8 mt-8 pt-8 border-t border-[#242424]"
        >
          <div>
            <p className="text-3xl font-bold tracking-[-0.04em] text-white">
              <Counter value={activeBids.length} />
            </p>
            <p className="text-[11px] text-[#666] uppercase tracking-[0.1em] mt-1">Active</p>
          </div>
          <div className="w-px h-10 bg-[#2a2a2a]" />
          <div>
            <p className="text-3xl font-bold tracking-[-0.04em] text-white">
              <Counter value={wonAuctions.length} />
            </p>
            <p className="text-[11px] text-[#666] uppercase tracking-[0.1em] mt-1">Won</p>
          </div>
          <div className="w-px h-10 bg-[#2a2a2a]" />
          <div>
            <p className="text-3xl font-bold tracking-[-0.04em] text-emerald-400">
              <Counter value={settledCount} />
            </p>
            <p className="text-[11px] text-[#666] uppercase tracking-[0.1em] mt-1">Settled</p>
          </div>
          <div className="w-px h-10 bg-[#2a2a2a]" />
          <div>
            <p className="text-3xl font-bold tracking-[-0.04em] text-white">
              ₹<Counter value={totalSettled} />
            </p>
            <p className="text-[11px] text-[#666] uppercase tracking-[0.1em] mt-1">Total settled</p>
            {totalPaid > totalSettled && (
              <p className="text-[10px] text-amber-500/70 mt-0.5">
                +₹{(totalPaid - totalSettled).toLocaleString('en-IN')} in escrow
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Active Bids ─────────────────────────────────────── */}
      <section className="mb-14">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="flex items-center gap-3 mb-6"
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">
            Active Bids
          </h2>
          <AnimatePresence>
            {activeBids.length > 0 && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[10px] font-bold text-cyan-400 bg-cyan-400/12
                           border border-cyan-400/25 px-2 py-0.5 rounded"
              >
                {activeBids.length}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {activeBids.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[#111] border border-[#2a2a2a] rounded-xl px-6 py-14 text-center"
          >
            <p className="text-[#666] text-[14px] mb-4">No active bids right now.</p>
            <Link
              to="/auctions"
              className="inline-block text-[12px] font-semibold bg-white text-[#080808]
                         px-5 py-2.5 rounded-xl hover:bg-[#e8e8e8] transition-all duration-150"
            >
              Browse auctions →
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4"
          >
            {activeBids.map((bid) => (
              <motion.div
                key={bid._id}
                variants={cardAnim}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-[#111] border border-[#2e2e2e] rounded-xl p-5
                           hover:border-[#3a3a3a] hover:shadow-[0_12px_40px_rgba(0,0,0,0.7)]
                           transition-colors duration-200 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r
                                from-transparent via-cyan-400/30 to-transparent" />
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-400">
                    Live
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-5 truncate tracking-[-0.01em]">
                  {bid.title}
                </h3>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#888] uppercase tracking-[0.08em]">
                      Current highest
                    </span>
                    <span className="text-[14px] font-bold text-white tabular-nums">
                      {fmt(bid.currentHighestBid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#888] uppercase tracking-[0.08em]">
                      Your proxy max
                    </span>
                    <span className="text-[14px] font-semibold text-cyan-400 tabular-nums">
                      {bid.myMaxBid == null ? '—' : fmt(bid.myMaxBid)}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-[#888] bg-[#1a1a1a] border border-[#2a2a2a]
                                rounded-lg px-3 py-2.5">
                  Closes {new Date(bid.endTime).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── Won Auctions ────────────────────────────────────── */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="flex items-center gap-3 mb-6"
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">
            Won Auctions &amp; Escrow
          </h2>
          <AnimatePresence>
            {wonAuctions.length > 0 && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[10px] font-bold text-amber-400 bg-amber-400/12
                           border border-amber-400/25 px-2 py-0.5 rounded"
              >
                {wonAuctions.length}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {wonAuctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#111] border border-[#2a2a2a] rounded-xl px-6 py-14 text-center"
          >
            <p className="text-[#666] text-[14px]">No won auctions yet.</p>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4"
          >
            {wonAuctions.map((auction) => {
              const receiptUrl = `/receipt?transactionId=${encodeURIComponent(auction.stripePaymentIntentId || '')}&auctionId=${encodeURIComponent(auction._id)}&itemName=${encodeURIComponent(auction.title)}&amountPaid=${auction.finalAmount}`;
              const certUrl    = `/certificate?auctionId=${encodeURIComponent(auction._id)}&itemTitle=${encodeURIComponent(auction.title)}&finalPrice=${auction.finalAmount}`;

              return (
                <motion.div
                  key={auction._id}
                  variants={cardAnim}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group relative bg-[#111] border border-[#2e2e2e] rounded-xl p-5
                             hover:border-[#3a3a3a] hover:shadow-[0_12px_40px_rgba(0,0,0,0.7)]
                             transition-colors duration-200 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r
                                  from-transparent via-amber-400/30 to-transparent" />

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]
                                     text-amber-300 bg-amber-400/12 border border-amber-400/25
                                     px-2 py-0.5 rounded">
                      Won
                    </span>
                  </div>

                  <h3 className="text-[14px] font-semibold text-white mb-5 truncate tracking-[-0.01em]">
                    {auction.title}
                  </h3>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#888] uppercase tracking-[0.08em]">
                        Final price
                      </span>
                      <span className="text-[16px] font-bold text-white tabular-nums tracking-[-0.02em]">
                        {fmt(auction.finalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#888] uppercase tracking-[0.08em]">
                        Escrow
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.08em]
                                        px-2.5 py-0.5 rounded border
                                        ${escrowStatusStyle(auction.escrowStatus)}`}>
                        {escrowStatusLabel(auction.escrowStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Action area — one state at a time */}
                  {auction.escrowStatus === 'pending_payment' && (
                    <button
                      onClick={() => handlePayNow(auction)}
                      className="w-full bg-white text-[#080808] font-semibold py-2.5 rounded-xl
                                 text-[12px] hover:bg-[#e8e8e8] active:scale-[0.98]
                                 transition-all duration-150"
                    >
                      Pay Now
                    </button>
                  )}

                  {auction.escrowStatus === 'held' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleConfirmDelivery(auction)}
                        className="w-full bg-white text-[#080808] font-semibold py-2.5 rounded-xl
                                   text-[12px] hover:bg-[#e8e8e8] active:scale-[0.98]
                                   transition-all duration-150"
                      >
                        Confirm Item Received
                      </button>
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center py-2 px-4 border border-[#2e2e2e]
                                   rounded-xl text-[11px] font-medium text-[#666]
                                   hover:text-white hover:border-[#444] transition-all duration-150"
                      >
                        View payment receipt ↗
                      </a>
                    </div>
                  )}

                  {auction.escrowStatus === 'released' && (
                    <div className="space-y-2">
                      <a
                        href={certUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center py-2.5 px-4 border border-[#2e2e2e]
                                   rounded-xl text-[12px] font-medium text-[#888]
                                   hover:text-white hover:border-[#444] transition-all duration-150"
                      >
                        View Certificate ↗
                      </a>
                      <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full text-center py-2 px-4 border border-[#2e2e2e]
                                   rounded-xl text-[11px] font-medium text-[#555]
                                   hover:text-[#888] hover:border-[#333] transition-all duration-150"
                      >
                        View payment receipt ↗
                      </a>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
