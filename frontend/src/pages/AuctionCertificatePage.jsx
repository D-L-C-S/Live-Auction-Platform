import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAuction } from '../services/api';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function issuedOn() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuctionCertificatePage() {
  const [params]  = useSearchParams();
  const auctionId = params.get('auctionId');

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(!!auctionId);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!auctionId) { setLoading(false); return; }
    fetchAuction(auctionId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [auctionId]);

  // Fallback values from query params (populated when API fetch fails or auctionId missing)
  const itemTitle   = data?.title        || params.get('itemTitle')   || 'Auction Item';
  const itemDesc    = data?.description  || params.get('itemDesc')    || '—';
  const winnerName  = data?.winner?.name || params.get('winnerName')  || 'Winner';
  const winnerEmail = data?.winner?.email|| params.get('winnerEmail') || '—';
  const sellerName  = data?.seller?.name || params.get('sellerName')  || 'Seller';
  const finalPrice  = data?.currentHighestBid || Number(params.get('finalPrice') || 0);
  const endTime     = data?.endTime
    ? new Date(data.endTime).toLocaleString('en-IN')
    : (params.get('auctionEndTime') || '—');
  const certId      = 'CERT-' + (auctionId || 'DEMO').slice(-8).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#8b7640]/30 border-t-[#8b7640] rounded-full animate-spin" />
      </div>
    );
  }

  const fields = [
    { label: 'Item',            value: itemTitle,   wide: true },
    { label: 'Description',     value: itemDesc,    wide: true, small: true },
    { label: 'Winning bidder',  value: winnerName },
    { label: 'Seller',          value: sellerName },
    { label: 'Final price',     value: formatINR(finalPrice), price: true },
    { label: 'Auction closed',  value: endTime,     mono: true },
    { label: 'Issued on',       value: issuedOn(),  mono: true },
    { label: 'Contact',         value: winnerEmail, mono: true, small: true },
  ];

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-4"
         style={{ background: '#f5f0e8', fontFamily: "'EB Garamond', Georgia, serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap" />

      <main className="bg-[#fffef9] border border-[#ccc5a8] max-w-2xl w-full px-14 py-12 relative"
            role="main" aria-label="Auction result certificate">

        {/* Inner border lines */}
        <div className="absolute inset-3 border border-[#d4c99a] pointer-events-none" />
        <div className="absolute inset-4 border border-dashed border-[#e0d9c2] pointer-events-none" />

        {/* Seal row */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 border-2 border-[#8b7640] rounded-full flex items-center
                          justify-center text-[10px] font-semibold text-[#8b7640] tracking-wide
                          text-center leading-tight shrink-0"
               style={{ fontFamily: "'DM Mono', monospace" }}>
            BID<br />AUTH
          </div>
          <div>
            <p className="text-[13px] font-semibold tracking-widest uppercase text-[#5c4e2a]">
              Live Auction Platform
            </p>
            <p className="text-[12px] text-[#8b7640] italic mt-0.5">
              Official auction result certificate
            </p>
          </div>
        </div>

        <h1 className="text-3xl font-semibold text-center mb-1 tracking-tight">
          Certificate of Auction Result
        </h1>
        <p className="text-center text-[12px] uppercase tracking-widest text-[#7a6a45] mb-8"
           style={{ fontFamily: "'DM Mono', monospace" }}>
          Auction ID · {auctionId || 'DEMO'}
        </p>

        <hr className="border-[#d4c99a] mb-6" />

        {error && (
          <p className="text-center text-sm text-[#a07050] mb-4 italic">
            (Could not fetch live data — showing available info)
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-6">
          {fields.map(({ label, value, wide, small, mono, price }) => (
            <div key={label} className={`flex flex-col gap-1 ${wide ? 'col-span-2' : ''}`}>
              <span className="text-[10px] font-medium uppercase tracking-widest text-[#8b7640]"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                {label}
              </span>
              <span className={`text-[#1a1a1a] leading-snug
                ${price ? 'text-2xl font-semibold text-[#3a2e10]' : ''}
                ${mono  ? 'text-[13px] text-[#5c4e2a]' : 'text-[17px]'}
                ${small ? 'text-[14px] text-[#4a3d18]' : ''}`}
                    style={mono ? { fontFamily: "'DM Mono', monospace" } : {}}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#f0ead8] border border-[#c8b97a] rounded px-5 py-4 text-[14px]
                        text-[#4a3d18] italic text-center leading-relaxed my-6">
          Delivery confirmed by the buyer. Escrow funds have been released to the seller.
          This certificate serves as proof of a completed, verified transaction.
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-2 gap-8 mt-10">
          {['Winner signature', 'Platform seal'].map((lbl) => (
            <div key={lbl} className="flex flex-col items-center gap-2">
              <div className="h-8" />
              <div className="w-full border-t border-[#b0a07a]" />
              <span className="text-[11px] text-[#8b7640] uppercase tracking-wider"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                {lbl}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#e0d9c2]">
          <span className="text-[11px] text-[#a0906a]"
                style={{ fontFamily: "'DM Mono', monospace" }}>
            {certId}
          </span>
          <div className="flex gap-2 no-print">
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="border border-[#a0906a] text-[#5c4e2a] px-4 py-2 text-[12px]
                         hover:bg-[#f0ead8] transition-colors"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              Copy link
            </button>
            <button
              onClick={() => window.print()}
              className="bg-[#3a2e10] text-[#fffef9] px-4 py-2 text-[12px]
                         hover:bg-[#4a3e20] transition-colors"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              Print / Save PDF
            </button>
          </div>
        </div>
      </main>

      <style>{`@media print { .no-print { display: none; } body { background: #fff; } }`}</style>
    </div>
  );
}
