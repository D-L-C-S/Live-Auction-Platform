import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// SocketContext provides a single shared socket instance to the whole app
export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect once on app mount
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;
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
