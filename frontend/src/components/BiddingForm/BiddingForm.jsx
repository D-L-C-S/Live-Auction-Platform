import { useState } from 'react';
import { placeBid, setProxyBid } from '../../services/api';

export default function BiddingForm({ auctionId, currentPrice }) {
  const [amount, setAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [error, setError] = useState('');

  const handleBid = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await placeBid({ auctionId, amount: Number(amount) });
      setAmount('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to place bid');
    }
  };

  const handleProxyBid = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await setProxyBid({ auctionId, maxAmount: Number(maxAmount) });
      setMaxAmount('');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to set proxy bid');
    }
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleBid}>
        <input
          type="number"
          placeholder={`Bid above $${currentPrice}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={currentPrice + 1}
          required
        />
        <button type="submit">Place Bid</button>
      </form>
      <form onSubmit={handleProxyBid}>
        <input
          type="number"
          placeholder="Max proxy bid amount"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          min={currentPrice + 1}
          required
        />
        <button type="submit">Set Proxy Bid</button>
      </form>
    </div>
  );
}
