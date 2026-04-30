/**
 * api.js — centralised fetch helpers for the Live Auction Platform
 *
 * Every function:
 *  - Reads the auth token from localStorage automatically
 *  - Throws a plain Error with the server's message on non-2xx responses
 *  - Returns parsed JSON on success
 *
 * Endpoints in use
 * ─────────────────────────────────────────────────────────────────
 *  createAuction        →  POST   /api/auctions
 *  getSellerListings    →  GET    /api/auctions?seller=me
 *  getAuction           →  GET    /api/auctions/:id
 *  placeBid             →  POST   /api/bids
 *  fetchEscrow          →  GET    /api/escrow/:auctionId        ← used by SellerDashboard
 *  confirmDelivery      →  POST   /api/escrow/confirm-delivery
 */

const API_BASE = "http://localhost:5000"; // update to deployed URL

// ─── Internal helper ─────────────────────────────────────────────────────────

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
  });
  if (!res.ok) {
    let msg;
    try { msg = (await res.json()).message; } catch { msg = await res.text(); }
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── Auction endpoints ───────────────────────────────────────────────────────

/**
 * Create a new auction listing.
 * @param {{ title, description, images, startingPrice, reservePrice, auctionEndTime }} payload
 */
export function createAuction(payload) {
  return apiFetch("/api/auctions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch all auctions belonging to the logged-in seller.
 * Used by SellerDashboard on mount.
 */
export function getSellerListings() {
  return apiFetch("/api/auctions?seller=me");
}

/**
 * Fetch a single auction's current state (bid history, status, etc.)
 * @param {string} auctionId
 */
export function getAuction(auctionId) {
  return apiFetch(`/api/auctions/${auctionId}`);
}

// ─── Bid endpoint ────────────────────────────────────────────────────────────

/**
 * Place a bid on an auction.
 * @param {{ auctionId, amount }} payload
 */
export function placeBid(payload) {
  return apiFetch("/api/bids", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Escrow endpoints ────────────────────────────────────────────────────────

/**
 * Fetch the escrow record for a given auction.
 * Called by SellerDashboard to populate the Escrow column for settled/closed listings.
 * @param {string} auctionId
 * @returns {{ status: "pending"|"held"|"released"|"disputed", ... }}
 */
export function fetchEscrow(auctionId) {
  return apiFetch(`/api/escrow/${auctionId}`);
}

/**
 * Buyer confirms delivery, triggering escrow fund release to the seller.
 * @param {{ auctionId }} payload
 */
export function confirmDelivery(payload) {
  return apiFetch("/api/escrow/confirm-delivery", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
