# Frontend

React 18 + Vite SPA for the Live Auction Platform.

## Stack

- **React 18** — UI
- **React Router v6** — client-side routing
- **Tailwind CSS** — utility-first styling
- **socket.io-client** — real-time bid updates
- **Axios** — HTTP requests to the backend API

## Setup

```bash
cp .env.example .env
npm install
npm run dev       # Vite dev server on port 5173
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_SOCKET_URL` | Socket.io server URL (default: `http://localhost:5000`) |

In development, Vite proxies all `/api` requests to `http://localhost:5000`, so you do not need to configure CORS or set an API base URL separately.

## Pages & Routing

| Path | Component | Description |
| --- | --- | --- |
| `/` | `BidderDashboard` | Active bids and won auctions for the logged-in user |
| `/auctions` | `AuctionListingPage` | Browse all auctions with search and sort |
| `/auctions/:id` | `AuctionPage` | Live auction room for a single auction |

## Key Components

### `SocketContext` / `useSocket`

A single `socket.io-client` instance is created at app mount inside `SocketProvider` and shared via React Context. Any component can call `useSocket()` to get the socket. The socket connects to `VITE_SOCKET_URL` and disconnects when the app unmounts.

### `AuctionRoom`

Owns all real-time state for a single auction: bid feed, current highest bid, outbid alerts, and the closed/winner banner. On mount it emits `join_room`; on unmount it emits `leave_room`. Listens for `new_bid` and `outbid` socket events. Bid placement uses an optimistic local update — the server's socket echo is filtered out for the bidder to avoid duplicates.

### `CountdownTimer`

Ticks every second from `endTime`. Calls `onExpired` once when the timer reaches zero. Color shifts green → yellow → red as the deadline approaches (thresholds: 1 hour, 5 minutes).

### `BiddingForm`

Collects a manual bid amount and an optional proxy max. The proxy max field is wired up in the UI but not yet sent to the backend (proxy bid service is in progress).

### `BidFeed`

Scrollable list of bids, newest first. The top bid row is highlighted. Timestamps are shown as relative time ("2m ago").

## API Service (`src/services/api.js`)

| Function | Method | Path | Description |
| --- | --- | --- | --- |
| `fetchAuctions()` | GET | `/api/auctions` | List all auctions; falls back to mock data if backend is unavailable |
| `fetchAuction(id)` | GET | `/api/auctions/:id` | Fetch one auction; falls back to mock match |
| `placeBid(auctionId, amount)` | POST | `/api/bids/:auctionId` | Place a bid |

The mock fallback data in `api.js` lets the UI run without a live backend during development.

## Implementation Status

| Feature | Status |
| --- | --- |
| Auction listing page (browse, search, sort) | Done |
| Auction room (live feed, countdown, bidding) | Done |
| Real-time bid + outbid socket events | Done |
| Bidder dashboard UI | Done (mock data) |
| Payment receipt link (to JSP) | Done |
| Auth (login / register UI) | In progress |
| Proxy bid UI → backend wiring | In progress |
| Dashboard → real API wiring | In progress |
