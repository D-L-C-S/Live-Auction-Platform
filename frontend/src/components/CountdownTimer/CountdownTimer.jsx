import { useState, useEffect } from 'react';

export default function CountdownTimer({ endTime }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - Date.now();
      if (diff <= 0) { setRemaining('Auction ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return <p>Ends in: <strong>{remaining}</strong></p>;
}
