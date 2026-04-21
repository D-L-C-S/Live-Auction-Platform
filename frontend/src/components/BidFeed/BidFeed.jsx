export default function BidFeed({ bids }) {
  return (
    <div>
      <h3>Bid History</h3>
      <ul>
        {bids.map((bid) => (
          <li key={bid._id}>
            <strong>{bid.bidder?.name ?? 'Bidder'}</strong> — ${bid.amount}
            {bid.isProxyTriggered && ' (auto)'}
            <span> {new Date(bid.createdAt).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
