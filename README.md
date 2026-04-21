# Live Auction Platform

A real-time bidding platform built with the MERN stack and Socket.io.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Database | MongoDB |
| Backend | Node.js, Express.js |
| Real-time | Socket.io |
| Payments | Stripe |
| Frontend | React.js (Vite) |
| Receipts/Certificates | JSP (Jakarta EE) |

## Project Structure

```text
├── backend/
│   ├── config/          # DB and Stripe setup
│   ├── controllers/     # auth, auction, bid, escrow
│   ├── middleware/       # JWT auth, request validation
│   ├── models/          # User, Auction, Bid, ProxyBid, Escrow
│   ├── routes/          # API route definitions
│   ├── services/        # Socket.io, proxy bid logic, Stripe
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/  # AuctionRoom, BidFeed, BiddingForm, CountdownTimer
│   │   ├── context/     # SocketContext
│   │   ├── hooks/       # useSocket
│   │   ├── pages/       # HomePage, AuctionPage
│   │   └── services/    # Axios API client
│   └── index.html
└── jsp/
    ├── auction-certificate.jsp
    ├── payment-receipt.jsp
    └── WEB-INF/web.xml
```

## Features

- Live bid feed via WebSockets — all connected clients see updates instantly
- Proxy bid system — auto-increments a bidder's offer up to their set maximum
- Escrow payments — Stripe holds funds after auction close, releases on delivery confirmation
- Auction result certificate and payment receipt pages (JSP)

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
