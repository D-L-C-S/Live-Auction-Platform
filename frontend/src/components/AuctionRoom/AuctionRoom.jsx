import { useSocket } from '../../hooks/useSocket';
import BidFeed from '../BidFeed/BidFeed';
import BiddingForm from '../BiddingForm/BiddingForm';
import CountdownTimer from '../CountdownTimer/CountdownTimer';

export default function AuctionRoom({ auction, bids, onNewBid }) {
  useSocket(auction._id, onNewBid);

  return (
    <div>
      <h2>{auction.title}</h2>
      <p>{auction.description}</p>
      <p>Current Price: <strong>${auction.currentPrice}</strong></p>
      <CountdownTimer endTime={auction.endTime} />
      {auction.status === 'active' && <BiddingForm auctionId={auction._id} currentPrice={auction.currentPrice} />}
      <BidFeed bids={bids} />
    </div>
  );
}
