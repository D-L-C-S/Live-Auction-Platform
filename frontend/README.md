# Frontend

React 18 + Vite SPA for the Live Auction Platform.

## Stack

- **React 18** — UI
- **React Router v6** — client-side routing
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — page and component animations
- **socket.io-client** — real-time bid updates
- **Axios** — HTTP requests to the backend API

## Setup

```bash
npm install
npm run dev       # Vite dev server on port 5173 — browser opens automatically
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

In development, Vite proxies `/api` and `/uploads` requests to `http://localhost:5000`.

## Pages & Routing

| Path | Component | Description |
| --- | --- | --- |
| `/` | `BidderDashboard` | Active bids and won auctions with escrow status |
| `/login` | `LoginPage` | Login form |
| `/register` | `RegisterPage` | Registration form |
| `/auctions` | `AuctionListingPage` | Browse all active auctions |
| `/auctions/:id` | `AuctionPage` | Live auction room for a single auction |
| `/seller` | `SellerDashboard` | Create listings, view real-time escrow status |

## Key Components

### `AuctionRoom`

Owns all real-time state for a single auction: bid feed, current highest bid, outbid alerts, and the closed/winner banner. Sellers see a "You are the seller" message instead of the bidding form, plus a reserve price panel showing the reserve amount and a live "Reserve met / not met" badge. Broken image URLs fall back to a placeholder automatically.

### `BiddingForm`

Collects a manual bid and an optional proxy max. The proxy max field validates in real-time as you type — the input border turns red and the submit button is disabled until it's valid.

### `BidFeed`

Scrollable list of bids, newest first, formatted in ₹ (Indian locale). Each entry has a colour-coded avatar, a "Lead" badge on the top bid, and an animated slide-in on arrival. Shows "No bids yet." for sellers and "No bids yet — be first." for buyers.

### `BidderDashboard`

Landing page for logged-in buyers. Shows animated stat counters (active bids, won count, total spent), a card grid of active bids with proxy max and closing time, and a separate grid of won auctions with escrow status. "Confirm Item Received" button releases escrow; "View Certificate" link appears once escrow is released.

### `CountdownTimer`

Ticks every second from `endTime`. Calls `onExpired` when the timer reaches zero. Color shifts green → yellow → red as the deadline approaches.

### `SellerDashboard`

Fetches the seller's real listings on mount. Create form includes drag-and-drop / click-to-select image upload (PNG, JPG, WEBP up to 5 MB) with a live preview, plus an optional reserve price. Closed listings show live escrow status fetched per auction.

## API Service (`src/services/api.js`)

| Function | Method | Path | Description |
| --- | --- | --- | --- |
| `fetchAuctions()` | GET | `/api/auctions` | List active auctions; falls back to mock data if backend is down |
| `fetchAuction(id)` | GET | `/api/auctions/:id` | Fetch one auction |
| `placeBid(auctionId, amount)` | POST | `/api/bids/:auctionId` | Place a bid |
| `placeProxyBid(auctionId, maxBid)` | POST | `/api/bids/:auctionId/proxy` | Set/update proxy max bid |
| `fetchEscrow(auctionId)` | GET | `/api/escrow/auction/:auctionId` | Get escrow record for a won auction |
| `createAuction(payload)` | POST | `/api/auctions` | Create a new listing |
| `getSellerListings()` | GET | `/api/auctions?seller=me` | Fetch all listings for the logged-in seller |
| `uploadImage(file)` | POST | `/api/upload` | Upload an image file, returns its URL |
