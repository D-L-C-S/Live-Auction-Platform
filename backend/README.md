# Backend

Express + Socket.io API server for the Live Auction Platform.

## Stack

- **Node.js / Express** — REST API
- **Socket.io** — real-time bid broadcasting
- **Mongoose** — MongoDB ODM
- **Multer** — image file uploads
- **jsonwebtoken / bcryptjs** — auth

## Setup

```bash
cp .env.example .env
npm install
npm run dev     # nodemon, restarts on change
npm start       # production
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | Server port (default `5000`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `PROXY_BID_INCREMENT` | Minimum increment for proxy auto-bids (default `1`) |

## API Routes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auctions` | optional | List auctions; `?seller=me` returns only the logged-in seller's listings (all statuses) |
| GET | `/api/auctions/:id` | — | Get one auction |
| POST | `/api/auctions` | JWT | Create an auction |
| POST | `/api/auctions/:id/close` | JWT | Close an auction (seller only) |
| POST | `/api/bids/:auctionId` | JWT | Place a bid |
| POST | `/api/bids/:auctionId/proxy` | JWT | Set/update proxy max bid |
| GET | `/api/bids/:auctionId` | — | Get bid history for an auction |
| GET | `/api/escrow/auction/:auctionId` | JWT | Get escrow status (winner or seller only) |
| POST | `/api/escrow/confirm-delivery` | JWT | Buyer confirms receipt, releases escrow to seller |
| GET | `/api/bidders/dashboard` | JWT | Bidder's active bids and won auctions with escrow status |
| POST | `/api/upload` | JWT | Upload an image (multipart/form-data, field: `image`, max 5 MB) |

Uploaded files are served as static assets at `/uploads/<filename>`.

## Socket.io Events

### Client → Server

| Event | Payload | Description |
| --- | --- | --- |
| `join_room` | `auctionId: string` | Subscribe to a live auction room |
| `leave_room` | `auctionId: string` | Unsubscribe from a room |

### Server → Client (emitted to auction room)

| Event | Payload | Description |
| --- | --- | --- |
| `new_bid` | `{ auctionId, bidId, bidder, amount, placedAt }` | A new highest bid was placed |
| `outbid` | `{ auctionId, outbidUserId }` | Previous leader was outbid — clients filter by userId |
| `auction_closed` | `{ auctionId, winnerId, finalAmount, reserveMet }` | Auction ended; `reserveMet: false` means reserve was not reached and there is no winner |

## Project Structure

```text
backend/
├── config/
│   └── db.js                  # Mongoose connection
├── controllers/
│   ├── authController.js
│   ├── auctionController.js
│   ├── bidController.js
│   ├── bidderController.js    # Bidder dashboard aggregation
│   └── escrowController.js
├── middleware/
│   ├── auth.js                # protect (JWT required) + optionalProtect (JWT if present)
│   └── validate.js            # Bid validation — amount, auction state, not own listing
├── models/
│   ├── User.js
│   ├── Auction.js
│   ├── Bid.js
│   ├── ProxyBid.js
│   └── Escrow.js              # status: held → released
├── routes/
│   ├── authRoutes.js
│   ├── auctionRoutes.js
│   ├── bidRoutes.js
│   ├── escrowRoutes.js
│   ├── bidderRoutes.js
│   └── uploadRoutes.js
├── services/
│   ├── socketService.js       # initSocket — stamps req.io on every request
│   ├── auctionService.js      # performClose — shared by controller + scheduler
│   ├── auctionScheduler.js    # cron job that auto-closes expired auctions
│   └── proxyBidService.js     # Proxy bid set / auto-increment logic
├── uploads/                   # Uploaded images (git-ignored, created on install)
└── server.js
```
