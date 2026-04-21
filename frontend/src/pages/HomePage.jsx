import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuctions } from '../services/api';

export default function HomePage() {
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    getAuctions().then((res) => setAuctions(res.data));
  }, []);

  return (
    <div>
      <h1>Live Auctions</h1>
      {auctions.map((a) => (
        <div key={a._id}>
          <Link to={`/auction/${a._id}`}>{a.title}</Link>
          <span> — Current: ${a.currentPrice}</span>
        </div>
      ))}
    </div>
  );
}
