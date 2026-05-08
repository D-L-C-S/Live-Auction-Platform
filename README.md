# Live Auction Platform

A full-stack real-time auction platform with live bidding, proxy bidding, and Stripe escrow payments.

## Stack

| Layer | Technology |
|---|---|
| Backend | Node.js · Express 4 · Socket.io 4 · Mongoose 8 |
| Frontend | React 18 · Vite 5 · Tailwind CSS · Framer Motion |
| Database | MongoDB |
| Payments | Stripe (manual capture escrow flow) |
| Documents | Jakarta EE JSP (auction certificate · payment receipt) |

## Project Structure

```
.
├── backend/          Node.js + Express API server
├── frontend/         React + Vite client
└── jsp/              Printable document pages (Jakarta EE)
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Stripe account (test keys sufficient)

### 1. Backend

```bash
cd backend
cp .env.example .env    # fill in MONGO_URI, JWT_SECRET, STRIPE keys
npm install
npm run dev             # starts on port 5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_URL and VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev             # starts on port 5173
```

### 3. JSP documents (optional)

The certificate and receipt pages are also available as React routes (`/certificate` and `/receipt`) without needing a servlet container. To use the original JSP versions, deploy the `jsp/` directory to Apache Tomcat 10+.

## Features

### Buyer
- Browse active auctions
- Place manual bids with real-time outbid notifications via Socket.io
- Set proxy (automatic) max bids — server auto-bids up to your limit
- Win auctions and pay via Stripe card form (funds held in escrow)
- Confirm delivery to release escrow to seller
- Download payment receipt and auction certificate

### Seller
- Create auction listings with image uploads
- Set starting price, reserve price, and end time
- End auctions early or cancel them at any time
- Track escrow status per listing (Awaiting Payment → Held → Released)

## Architecture Notes

### Real-time bidding
Socket.io rooms mirror auction IDs. Every bid emits a `new_bid` event to all connected clients in that room. The server also emits `auction_closed` and `auction_cancelled` events so UIs update instantly.

### Proxy bidding
After every manual bid the server runs a proxy processing loop: the top eligible proxy auto-increments one step above the new highest bid, up to their max. This repeats until no proxy can outbid, ensuring fair automatic competition.

### Escrow payment flow
Stripe `capture_method: 'manual'` authorizes (reserves) funds at card entry without charging. Capture only happens when the buyer confirms delivery.

```
pending_payment  →  held (card authorized)  →  released (delivery confirmed, funds captured)
```

### Scheduled auction closing
`node-cron` periodically finds auctions past their `endTime` with status `active` and closes them automatically, creating an Escrow record for the winner.

## Environment Variables

See [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for the full variable reference.
