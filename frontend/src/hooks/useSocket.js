import { useEffect } from 'react';
import { useSocketRef } from '../context/SocketContext';

export function useSocket(auctionId, onNewBid) {
  const socketRef = useSocketRef();

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !auctionId) return;

    socket.emit('join_auction', auctionId);
    socket.on('new_bid', onNewBid);

    return () => {
      socket.emit('leave_auction', auctionId);
      socket.off('new_bid', onNewBid);
    };
  }, [auctionId, onNewBid, socketRef]);
}
