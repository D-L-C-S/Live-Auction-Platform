import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchAuction } from '../services/api';
import AuctionRoom from '../components/AuctionRoom/AuctionRoom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

export default function AuctionPage() {
  const { id } = useParams();
  const socket = useSocket();
  const { currentUser } = useAuth();

  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId || '';

  const [auction,   setAuction]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');

    fetchAuction(id)
      .then((data) => { if (!cancelled) setAuction(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not load auction.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-[#555] rounded-full
                          animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-[#666]">Loading auction…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#666] mb-3">
            Error
          </p>
          <p className="text-[#666] text-[13px] mb-6">{error}</p>
          <Link
            to="/auctions"
            className="inline-flex items-center gap-2 text-[12px] font-medium text-[#888]
                       border border-[#2a2a2a] px-4 py-2 rounded-lg hover:text-white
                       hover:border-[#3a3a3a] transition-all duration-150"
          >
            ← Browse Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <Link
          to="/auctions"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#777]
                     hover:text-[#ccc] transition-colors duration-150"
        >
          <span className="text-[#777]">←</span>
          Browse Auctions
        </Link>
      </div>
      <AuctionRoom
        auction={auction}
        socket={socket}
        currentUserId={currentUserId}
      />
    </div>
  );
}
