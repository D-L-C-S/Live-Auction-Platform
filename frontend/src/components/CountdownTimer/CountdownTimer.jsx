import React, { useEffect, useRef, useState } from 'react';

function getTimeLeft(endTime) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs: diff,
  };
}

function DigitBlock({ value, label, urgent }) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="digit-block">
      <span className={`digit-value ${urgent ? 'text-red-400' : ''}`}>{pad(value)}</span>
      <span className="digit-label">{label}</span>
    </div>
  );
}

function Colon({ urgent }) {
  return (
    <span className={`text-lg font-bold mb-3 self-start mt-0.5 ${urgent ? 'text-red-400/60' : 'text-[#777]'}`}>
      :
    </span>
  );
}

export default function CountdownTimer({ endTime, onExpired, compact = false }) {
  const [timeLeft,    setTimeLeft]    = useState(() => getTimeLeft(endTime));
  const expiredCalled = useRef(false);
  const onExpiredRef  = useRef(onExpired);
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
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold
                       uppercase tracking-[0.08em] bg-[#1c1c1c] text-[#777] border border-[#2a2a2a]">
        Ended
      </span>
    );
  }

  const urgent = timeLeft.totalMs <= 300_000;
  const warn   = timeLeft.totalMs <= 3_600_000 && !urgent;

  // Compact mode — for cards
  if (compact) {
    const pad = (n) => String(n).padStart(2, '0');
    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    parts.push(`${pad(timeLeft.hours)}h`);
    parts.push(`${pad(timeLeft.minutes)}m`);
    parts.push(`${pad(timeLeft.seconds)}s`);

    const colorCls = urgent ? 'text-red-400 border-red-500/20 bg-red-500/8'
      : warn ? 'text-amber-400 border-amber-500/20 bg-amber-500/8'
      : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8';

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px]
                        font-semibold font-mono border ${colorCls} ${urgent ? 'animate-pulse' : ''}`}>
        {parts.join(' ')}
      </span>
    );
  }

  // Full segmented display
  return (
    <div className="flex items-end gap-1.5">
      {timeLeft.days > 0 && (
        <>
          <DigitBlock value={timeLeft.days} label="days" urgent={urgent} />
          <Colon urgent={urgent} />
        </>
      )}
      <DigitBlock value={timeLeft.hours} label="hrs" urgent={urgent} />
      <Colon urgent={urgent} />
      <DigitBlock value={timeLeft.minutes} label="min" urgent={urgent} />
      <Colon urgent={urgent} />
      <DigitBlock value={timeLeft.seconds} label="sec" urgent={urgent} />
    </div>
  );
}
