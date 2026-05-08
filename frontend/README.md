# Frontend

React 18 + Vite client for the Live Auction Platform.

## Scripts

```bash
npm run dev       # Vite dev server — http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

## Environment Variables

Copy `.env.example` to `.env`.

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL (e.g. `http://localhost:5000`) |
| `VITE_SOCKET_URL` | No | Socket.io server origin. Falls back to `VITE_API_URL` if omitted |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (`pk_test_...`) |

## Pages

| Route | Component | Auth | Description |
|---|---|---|---|
| `/login` | `LoginPage` | — | Email + password login |
| `/register` | `RegisterPage` | — | Create account |
| `/` | `BidderDashboard` | Required | Buyer home — active bids, won auctions, escrow payment |
| `/auctions` | `AuctionListingPage` | Required | Browse all active auctions |
| `/auctions/:id` | `AuctionPage` | Required | Live auction room |
| `/seller` | `SellerDashboard` | Required | Seller home — create listings, manage auctions |
| `/receipt` | `PaymentReceiptPage` | — | Printable payment receipt (query params) |
| `/certificate` | `AuctionCertificatePage` | — | Printable auction result certificate |

## Key Components

### `AuctionRoom`
Composes the live auction experience:
- **`CountdownTimer`** — live countdown to `endTime`
- **`BidFeed`** — scrolling real-time bid history
- **`BiddingForm`** — place manual bid or set proxy max bid

Seller view shows **End Auction** and **Cancel Auction** buttons. Handles `auction_cancelled` socket event to show a cancelled banner.

### `PaymentModal`
Stripe `CardElement` form. Opens when buyer clicks "Pay Now" on a won auction.

1. Calls `initPayment(auctionId)` on mount to get a Stripe `clientSecret`
2. Buyer enters card details (test: `4242 4242 4242 4242`)
3. Calls `stripe.confirmCardPayment` — funds authorized but not captured
4. On success calls `markPaymentHeld` to record the authorization in the DB
5. Escrow moves to `held`

### `ProtectedRoute`
Wrapper that redirects to `/login` if no valid JWT is in localStorage.

## Context

| Context | Purpose |
|---|---|
| `AuthContext` | `isAuthenticated`, `login`, `logout` — reads/writes `token` and `authUser` in localStorage |
| `SocketContext` | Single `socket.io-client` instance shared across the app |

## Services (`src/services/api.js`)

All HTTP calls go through Axios with `VITE_API_URL` as the base URL. The `getAuthHeaders()` helper attaches `Authorization: Bearer <token>` from localStorage.

| Function | Method | Endpoint |
|---|---|---|
| `fetchAuctions()` | GET | `/api/auctions` |
| `fetchAuction(id)` | GET | `/api/auctions/:id` |
| `createAuction(payload)` | POST | `/api/auctions` |
| `closeAuction(auctionId)` | POST | `/api/auctions/:id/close` |
| `cancelAuction(auctionId)` | POST | `/api/auctions/:id/cancel` |
| `placeBid(auctionId, amount)` | POST | `/api/bids/:auctionId` |
| `placeProxyBid(auctionId, maxBid)` | POST | `/api/bids/:auctionId/proxy` |
| `fetchEscrow(auctionId)` | GET | `/api/escrow/auction/:auctionId` |
| `initPayment(auctionId)` | POST | `/api/escrow/init-payment` |
| `markPaymentHeld(auctionId, piId)` | POST | `/api/escrow/mark-payment-held` |
| `uploadImage(file)` | POST | `/api/upload` |

`fetchAuctions()` and `fetchAuction(id)` fall back to `MOCK_AUCTIONS` (defined in `api.js`) if the backend is unreachable, so the UI remains browsable in offline/demo mode.

## Stripe Test Cards

| Card number | Scenario |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |

Use any future expiry date and any 3-digit CVC.
