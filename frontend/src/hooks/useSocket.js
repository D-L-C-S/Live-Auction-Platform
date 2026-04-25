import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

// Returns the shared socket.io-client instance from SocketContext
export function useSocket() {
  return useContext(SocketContext);
}
