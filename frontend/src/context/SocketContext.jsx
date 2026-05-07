import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// SocketContext provides a single shared socket instance to the whole app
export const SocketContext = createContext(null);

function normalizeSocketBase(url) {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').replace(/\/api$/, '');
}

const SOCKET_URL =
  normalizeSocketBase(import.meta.env.VITE_SOCKET_URL) ||
  normalizeSocketBase(import.meta.env.VITE_API_URL) ||
  (import.meta.env.PROD && typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5000');

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
