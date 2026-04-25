const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (auctionId) => {
      socket.join(auctionId);
    });

    socket.on('leave_room', (auctionId) => {
      socket.leave(auctionId);
    });

    // Reconnection: client re-emits join_room on reconnect — no extra server logic needed
  });

  return (req, _res, next) => {
    req.io = io;
    next();
  };
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
