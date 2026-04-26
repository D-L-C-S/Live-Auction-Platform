import React, { useEffect, useRef, useState } from 'react';

// Calculates remaining time from now until endTime and calls onExpired when done
function getTimeLeft(endTime) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs: diff,
  };
}

export default function CountdownTimer({ endTime, onExpired }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endTime));
  const expiredCalled = useRef(false);
  // Keep a ref so the interval always calls the latest onExpired without restarting
  const onExpiredRef = useRef(onExpired);
  useEffect(() => { onExpiredRef.current = onExpired; });

  useEffect(() => {
    expiredCalled.current = false;
    setTimeLeft(getTimeLeft(endTime));

    const interval = setInterval(() => {
      const t = getTimeLeft(endTime);
      setTimeLeft(t);
      if (!t && !expiredCalled.current) {
        expiredCalled.current = true;
        clearInterval(interval);
        onExpiredRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">
        Auction Closed
      </span>
    );
  }

  // Color shifts: green → yellow → red as deadline approaches
  const colorClass =
    timeLeft.totalMs > 3600000
      ? 'bg-green-100 text-green-800'
      : timeLeft.totalMs > 300000
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';

  const pad = (n) => String(n).padStart(2, '0');

  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  parts.push(`${pad(timeLeft.hours)}h`);
  parts.push(`${pad(timeLeft.minutes)}m`);
  parts.push(`${pad(timeLeft.seconds)}s`);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
      {parts.join(' ')}
    </span>
  );
}
