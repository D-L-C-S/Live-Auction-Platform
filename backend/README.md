# Backend

Node.js + Express API server for the Live Auction Platform.

## Scripts

```bash
npm run dev     # nodemon — auto-restart on file changes
npm start       # node server.js — production
```

Server starts on `PORT` (default `5000`).

## Environment Variables

Copy `.env.example` to `.env` and fill in each value.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `CLIENT_URL` | Yes | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `STRIPE_SECRET_KEY` | Yes* | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret (`whsec_...`) — only needed for local webhook forwarding |
| `PROXY_BID_INCREMENT` | No | Minimum bid step for proxy bidding (default: 1) |

*If `STRIPE_SECRET_KEY` is absent the server starts but all `/api/escrow` payment endpoints return `503`.

## API Reference

All routes are prefixed with `/api`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login, returns JWT |

**Register body:** `{ name, email, password, role? }`  
**Login body:** `{ email, password }`  
**Login response:** `{ token, user: { _id, name, email, role } }`

---

### Auctions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/auctions` | Optional | List all auctions. Pass `?seller=me` to get your own listings |
| GET | `/auctions/:id` | Optional | Get one auction |
| POST | `/auctions` | Required | Create auction listing |
| POST | `/auctions/:id/close` | Required | End auction early (seller only) |
| POST | `/auctions/:id/cancel` | Required | Cancel auction, void escrow (seller only) |

**Create body:** `{ title, description, startingPrice, reservePrice?, endTime, images?, category? }`

---

### Bids

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/bids/:auctionId` | — | Get all bids for an auction |
| POST | `/bids/:auctionId` | Required | Place a manual bid `{ amount }` |
| POST | `/bids/:auctionId/proxy` | Required | Set a proxy max bid `{ maxBid }` |

---

### Escrow

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/escrow/auction/:auctionId` | Required | Get escrow record (winner or seller only) |
| POST | `/escrow/init-payment` | Required | Create Stripe PaymentIntent, returns `{ clientSecret }` |
| POST | `/escrow/mark-payment-held` | Required | Verify PI authorized, move escrow to `held` |
| POST | `/escrow/confirm-delivery` | Required | Capture PI funds, move escrow to `released` |

---

### Bidder Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/bidders/dashboard` | Required | Active bids + won auctions with escrow status |

---

### File Upload

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload` | Required | Upload image (max 5 MB, images only). Returns `{ url }` |

Uploaded files are stored in `uploads/` and served statically at `/uploads/<filename>`.

---

### Stripe Webhooks

| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/stripe` | Raw body — Stripe event handler |

Handled events:
- `payment_intent.amount_capturable_updated` → moves escrow to `held`

The webhook route is registered **before** `express.json()` to receive the raw body required for signature verification.

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, lowercase |
| passwordHash | String | bcrypt |
| role | String | `buyer` · `seller` · `admin` (default: `buyer`) |

### Auction
| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | required |
| images | [String] | array of URLs |
| seller | ObjectId | ref User |
| startingPrice | Number | required |
| reservePrice | Number | optional |
| currentHighestBid | Number | denormalized for fast reads |
| currentHighestBidder | ObjectId | ref User |
| startTime | Date | required |
| endTime | Date | required |
| status | String | `pending` · `active` · `closed` · `cancelled` |
| winner | ObjectId | ref User |
| category | String | |

### Bid
| Field | Type | Notes |
|---|---|---|
| auction | ObjectId | ref Auction, indexed |
| bidder | ObjectId | ref User |
| amount | Number | required |

### ProxyBid
| Field | Type | Notes |
|---|---|---|
| auction | ObjectId | ref Auction |
| bidder | ObjectId | ref User |
| maxBid | Number | upper limit |
| bidIncrement | Number | step size (default: 1) |
| isActive | Boolean | false after auction closes or outbid beyond max |

Unique index on `(auction, bidder)` — one proxy bid per user per auction.

### Escrow
| Field | Type | Notes |
|---|---|---|
| auction | ObjectId | ref Auction, unique |
| winner | ObjectId | ref User |
| seller | ObjectId | ref User |
| amount | Number | final winning bid |
| stripePaymentIntentId | String | Stripe PI id |
| status | String | `pending_payment` · `held` · `released` |

---

## Key Services

### `services/stripeService.js`
Wraps Stripe SDK calls. `assertStripe()` throws `503` if `STRIPE_SECRET_KEY` is unset so the rest of the app fails gracefully.

- `createPaymentIntent(amountINR, metadata)` — creates a PI with `capture_method: 'manual'`
- `capturePaymentIntent(id)` — captures authorized funds at delivery
- `cancelPaymentIntent(id)` — voids a PI (used on auction cancel)
- `retrievePaymentIntent(id)` — server-side verification before trusting frontend claims

### `services/proxyBidService.js`
Called after every manual bid. Finds the top eligible proxy bidder and places one increment above the current highest bid, repeating until no proxy can outbid (capped at 100 iterations).

### `services/socketService.js`
Returns an Express middleware that attaches the `io` instance to `req`. Controllers use `req.io.to(auctionId).emit(...)` to push live events.

### `services/auctionService.js`
Contains `closeAuction(auctionId)` — shared close logic used by both the cron job and the manual close endpoint. Sets the winner, creates the Escrow record, and emits `auction_closed`.
