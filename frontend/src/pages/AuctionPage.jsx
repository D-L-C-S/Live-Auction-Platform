import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAuction } from '../services/api';
import AuctionRoom from '../components/AuctionRoom/AuctionRoom';
import { useSocket } from '../hooks/useSocket';

// Hardcoded demo user — replace with real auth when auth is implemented
const CURRENT_USER_ID = 'charan-demo-user';

export default function AuctionPage() {
  const { id } = useParams();
  const socket = useSocket();

  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');

    fetchAuction(id)
      .then((data) => {
        if (!cancelled) setAuction(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load auction.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading auction…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-sm">
          <p className="text-red-500 font-semibold mb-2">Error</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link
            to="/auctions"
            className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            ← Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link to="/auctions" className="text-sm text-blue-600 hover:underline font-medium">
          ← Browse Auctions
        </Link>
      </div>
      <AuctionRoom
        auction={auction}
        socket={socket}
        currentUserId={CURRENT_USER_ID}
      />
    </div>
  );
}
