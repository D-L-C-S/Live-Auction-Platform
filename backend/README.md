# Backend

Express + Socket.io API server for the Live Auction Platform.

## Stack

- **Node.js / Express** — REST API
- **Socket.io** — real-time bid broadcasting
- **Mongoose** — MongoDB ODM
- **Stripe SDK** — escrow payments (manual capture)
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
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_…`) |
| `CLIENT_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |

## API Routes

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auctions` | — | List all auctions |
| GET | `/api/auctions/:id` | — | Get one auction |
| POST | `/api/auctions` | JWT | Create an auction |
| PATCH | `/api/auctions/:id/close` | JWT | Close an auction |
| POST | `/api/bids/:auctionId` | JWT | Place a bid |
| POST | `/api/bids/:auctionId/proxy` | JWT | Set/update proxy max bid and auto-resolve bidding |
| POST | `/api/escrow/confirm-delivery` | JWT | Buyer confirms receipt, releases funds |
| POST | `/api/escrow/refund` | JWT | Refund winner's held payment |
| POST | `/api/escrow/webhook` | Stripe sig | Stripe webhook handler |

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
| `outbid` | `{ auctionId, outbidUserId }` | Previous leader was outbid — clients self-filter by userId |
| `auction_closed` | `{ auctionId, winnerId, finalAmount }` | Auction ended |

## Project Structure

```text
backend/
├── config/
│   ├── db.js             # Mongoose connection
│   └── stripe.js         # Stripe singleton
├── controllers/
│   ├── authController.js
│   ├── auctionController.js
│   ├── bidController.js
│   └── escrowController.js
├── middleware/
│   ├── auth.js           # JWT bearer guard — attaches req.user
│   └── validate.js       # Bid validation (amount > floor, auction active, not expired)
├── models/
│   ├── User.js
│   ├── Auction.js        # currentHighestBid + currentHighestBidder denormalised for fast validation
│   ├── Bid.js
│   ├── ProxyBid.js
│   └── Escrow.js         # status: held → released | refunded
├── routes/
│   ├── authRoutes.js
│   ├── auctionRoutes.js
│   ├── bidRoutes.js
│   └── escrowRoutes.js
├── services/
│   ├── socketService.js      # initSocket(httpServer) — returns Express middleware that stamps req.io
│   ├── proxyBidService.js    # Proxy bid set / auto-increment logic
│   └── stripeService.js      # PaymentIntent create / capture / cancel
└── server.js
```

## Implementation Status

| Module | Status |
| --- | --- |
| Express + Socket.io server | Done |
| Mongoose models (User, Auction, Bid, Escrow) | Done |
| JWT auth middleware | Done |
| Bid validation middleware | Done |
| Bid placement endpoint + socket events | Done |
| Auth controller (register / login) | In progress |
| Auction controller (CRUD, close) | In progress |
| Proxy bid service | Done |
| Escrow controller + Stripe service | In progress |
| ProxyBid model | Done |
| Stripe webhook handler | In progress |
