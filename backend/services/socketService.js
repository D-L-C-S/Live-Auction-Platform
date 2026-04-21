const socketService = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_auction', (auctionId) => {
      socket.join(auctionId);
      console.log(`${socket.id} joined auction room: ${auctionId}`);
    });

    socket.on('leave_auction', (auctionId) => {
      socket.leave(auctionId);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Attach io to every request so controllers can emit events
  return (req, res, next) => {
    req.io = io;
    next();
  };
};

module.exports = socketService;
