# Live Auction Platform

A real-time auction platform built with the MERN stack and Socket.io. Sellers list items with photos, buyers place live bids that broadcast instantly to all participants, and a simple escrow releases funds to the seller once the buyer confirms delivery.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Database | MongoDB + Mongoose |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| File uploads | Multer |
| Frontend | React 18, Vite, Tailwind CSS |
| Documents | JSP (Jakarta EE) — receipt & certificate |

## Repository Structure

```text
├── backend/          # Express + Socket.io API server
├── frontend/         # React + Vite SPA
└── jsp/              # Jakarta EE pages for printable documents
```

See each subdirectory for its own README with setup, environment variables, and API details.

## Quick Start

Both servers must run concurrently. Vite proxies `/api` and `/uploads` requests to Express, so no CORS configuration is needed in development.

**Backend** (port 5000)

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev
```

**Frontend** (port 5173)

```bash
cd frontend
npm install
npm run dev            # browser opens automatically
```

**JSP documents** — served separately by a Jakarta EE container (e.g. Tomcat). See [jsp/README.md](jsp/README.md).

## Features

| Feature | Status |
| --- | --- |
| Browse live auction listings | Done |
| Real-time bid feed via WebSocket | Done |
| Bid validation (amount, auction state, end time, not own auction) | Done |
| Proxy bidding (auto-increment to max) | Done |
| Reserve price — auction closes without a winner if reserve not met | Done |
| Outbid toast notification | Done |
| Countdown timer per auction | Done |
| Image upload (drag & drop or file picker, 5 MB limit) | Done |
| Seller dashboard — create listings, view real escrow status | Done |
| Bidder dashboard — active bids and won auctions with escrow | Done |
| Auth — register, login, JWT sessions | Done |
| Auction CRUD (create, list, close) | Done |
| Manual escrow — hold on close, release on delivery confirmation | Done |
| Auction certificate (JSP) | Done |
