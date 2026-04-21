import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL);
    return () => socketRef.current?.disconnect();
  }, []);

  return <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>;
}

export const useSocketRef = () => useContext(SocketContext);
