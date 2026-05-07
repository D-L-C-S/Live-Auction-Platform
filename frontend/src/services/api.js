import axios from 'axios';

// In production VITE_API_URL points to the Railway backend service URL
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

// Mock auctions used as fallback when backend is unavailable
const now = Date.now();
export const MOCK_AUCTIONS = [
  {
    _id: 'demo-auction-1',
    title: 'Vintage Guitar',
    description: 'A beautiful vintage acoustic guitar from 1965. Well-preserved with original tuning pegs and warm tone.',
    images: [],
    startingPrice: 500,
    currentHighestBid: 750,
    currentHighestBidder: { _id: 'user-abc', name: 'JohnD' },
    startTime: new Date(now - 3600000).toISOString(),
    endTime: new Date(now + 3600000).toISOString(), // 1 hour from now
    status: 'active',
    category: 'Music',
    seller: { name: 'VintageShop' },
  },
  {
    _id: 'demo-auction-2',
    title: 'Antique Clock',
    description: 'An ornate 19th-century mantle clock with original brass movement. Fully functional and recently serviced.',
    images: [],
    startingPrice: 300,
    currentHighestBid: 420,
    currentHighestBidder: { _id: 'user-def', name: 'ClockLover' },
    startTime: new Date(now - 7200000).toISOString(),
    endTime: new Date(now + 7200000).toISOString(), // 2 hours from now
    status: 'active',
    category: 'Antiques',
    seller: { name: 'TimePieces' },
  },
  {
    _id: 'demo-auction-3',
    title: 'Rare Painting',
    description: 'Original oil painting by a regional artist, circa 1940. Landscape scene with mountain lake. Signed on reverse.',
    images: [],
    startingPrice: 1200,
    currentHighestBid: 1800,
    currentHighestBidder: { _id: 'user-ghi', name: 'ArtCollector99' },
    startTime: new Date(now - 1800000).toISOString(),
    endTime: new Date(now + 1800000).toISOString(), // 30 min from now
    status: 'active',
    category: 'Art',
    seller: { name: 'GalleryOne' },
  },
  {
    _id: 'demo-auction-4',
    title: 'Classic Watch',
    description: 'Swiss-made mechanical watch from 1970. Stainless steel case, original leather strap, fully serviced.',
    images: [],
    startingPrice: 800,
    currentHighestBid: 1350,
    currentHighestBidder: { _id: 'user-jkl', name: 'WatchFan' },
    startTime: new Date(now - 86400000).toISOString(),
    endTime: new Date(now - 3600000).toISOString(), // ended 1 hour ago
    status: 'closed',
    category: 'Watches',
    seller: { name: 'TimelessGoods' },
    winner: { _id: 'user-jkl', name: 'WatchFan' },
  },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// GET /api/auctions — returns all auctions; falls back to mock data on error
export async function fetchAuctions() {
  try {
    const { data } = await axios.get('/api/auctions');
    return data.auctions;
  } catch {
    return MOCK_AUCTIONS;
  }
}

// GET /api/auctions/:id — returns one auction by id; falls back to mock match
export async function fetchAuction(id) {
  try {
    const { data } = await axios.get(`/api/auctions/${id}`);
    return data.auction;
  } catch {
    const mock = MOCK_AUCTIONS.find((a) => a._id === id);
    if (mock) return mock;
    throw new Error(`Auction "${id}" not found.`);
  }
}

// POST /api/bids/:auctionId — places a bid; auctionId in path, amount in body
export async function placeBid(auctionId, amount) {
  const { data } = await axios.post(`/api/bids/${auctionId}`, { amount }, { headers: getAuthHeaders() });
  return data;
}

// POST /api/bids/:auctionId/proxy — sets a proxy max bid; auto-bids up to maxBid
export async function placeProxyBid(auctionId, maxBid) {
  const { data } = await axios.post(`/api/bids/${auctionId}/proxy`, { maxBid }, { headers: getAuthHeaders() });
  return data;
}

// GET /api/escrow/auction/:auctionId — fetch escrow status for a won auction
export async function fetchEscrow(auctionId) {
  const { data } = await axios.get(`/api/escrow/auction/${auctionId}`, { headers: getAuthHeaders() });
  return data.escrow;
}

// POST /api/escrow/init-payment — create Stripe PaymentIntent, returns { clientSecret }
export async function initPayment(auctionId) {
  const { data } = await axios.post('/api/escrow/init-payment', { auctionId }, { headers: getAuthHeaders() });
  return data;
}

// POST /api/escrow/mark-payment-held — verify PI and move escrow from pending_payment → held
export async function markPaymentHeld(auctionId, paymentIntentId) {
  const { data } = await axios.post('/api/escrow/mark-payment-held', { auctionId, paymentIntentId }, { headers: getAuthHeaders() });
  return data.escrow;
}

// POST /api/upload — upload an image file, returns { url }
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const token = localStorage.getItem('token');
  const { data } = await axios.post('/api/upload', formData, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  return data.url;
}

// POST /api/auctions — create a new auction listing
export async function createAuction(payload) {
  const { data } = await axios.post('/api/auctions', payload, { headers: getAuthHeaders() });
  return data.auction;
}

// POST /api/auctions/:id/close — seller manually ends an active auction early
export async function closeAuction(auctionId) {
  const { data } = await axios.post(`/api/auctions/${auctionId}/close`, {}, { headers: getAuthHeaders() });
  return data.auction;
}

// POST /api/auctions/:id/cancel — seller cancels auction; voids escrow and any Stripe PI
export async function cancelAuction(auctionId) {
  const { data } = await axios.post(`/api/auctions/${auctionId}/cancel`, {}, { headers: getAuthHeaders() });
  return data.auction;
}

// GET /api/auctions?seller=me — fetch all listings for the logged-in seller
export async function getSellerListings() {
  const { data } = await axios.get('/api/auctions?seller=me', { headers: getAuthHeaders() });
  return data.auctions;
}
