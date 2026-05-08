const { Server } = require('socket.io');
const { isAllowedOrigin } = require('../config/origins');

let io;

const initSocket = (httpServer, allowedOrigins = []) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'), false);
      },
      methods: ['GET', 'POST'],
      credentials: true,
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
