# Live Auction Platform

A real-time auction platform built with the MERN stack, Socket.io, and Stripe escrow. Buyers browse live listings, place bids that broadcast instantly to all participants, and pay through a held escrow that releases only after delivery is confirmed.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Database | MongoDB + Mongoose |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Payments | Stripe (manual capture / escrow) |
| Frontend | React 18, Vite, Tailwind CSS |
| Documents | JSP (Jakarta EE) — receipt & certificate |

## Repository Structure

```text
├── backend/          # Express + Socket.io API server
├── frontend/         # React + Vite SPA
└── jsp/              # Jakarta EE pages for printable documents
```

See each subdirectory for its own README with setup, environment variables, and implementation status.

## Quick Start

Both servers must run concurrently. Vite proxies `/api` requests to Express, so no CORS configuration is needed in development.

**Backend** (port 5000)

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, STRIPE keys
npm install
npm run dev
```

**Frontend** (port 5173)

```bash
cd frontend
cp .env.example .env   # set VITE_SOCKET_URL if not localhost:5000
npm install
npm run dev
```

**JSP documents** — served separately by a Jakarta EE container (e.g. Tomcat). See [jsp/README.md](jsp/README.md).

## Features

| Feature | Status |
| --- | --- |
| Browse live auction listings | Done |
| Real-time bid feed via WebSocket | Done |
| Bid validation (amount, auction state, end time) | Done |
| Outbid toast notification | Done |
| Countdown timer per auction | Done |
| Bidder dashboard with active bids and won auctions | Done (mock data) |
| Auth — register, login, JWT sessions | In progress |
| Auction CRUD (create, list, close) | In progress |
| Proxy bid (auto-increment to max) | In progress |
| Stripe escrow — hold, release, refund | In progress |
| Payment receipt (JSP) | Done |
| Auction certificate (JSP) | In progress |
