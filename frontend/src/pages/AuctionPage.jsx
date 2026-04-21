import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getAuction, getBidHistory } from '../services/api';
import AuctionRoom from '../components/AuctionRoom/AuctionRoom';

export default function AuctionPage() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);

  const handleNewBid = useCallback(({ bid, currentPrice }) => {
    setBids((prev) => [bid, ...prev]);
    setAuction((prev) => prev ? { ...prev, currentPrice } : prev);
  }, []);

  useEffect(() => {
    getAuction(id).then((res) => setAuction(res.data));
    getBidHistory(id).then((res) => setBids(res.data));
  }, [id]);

  if (!auction) return <p>Loading...</p>;

  return <AuctionRoom auction={auction} bids={bids} onNewBid={handleNewBid} />;
}
