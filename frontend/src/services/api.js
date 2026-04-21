import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getAuctions = () => api.get('/auctions');
export const getAuction = (id) => api.get(`/auctions/${id}`);
export const createAuction = (data) => api.post('/auctions', data);
export const getBidHistory = (auctionId) => api.get(`/bids/${auctionId}/history`);
export const placeBid = (data) => api.post('/bids', data);
export const setProxyBid = (data) => api.post('/bids/proxy', data);
export const initiateEscrow = (data) => api.post('/escrow/initiate', data);
export const confirmDelivery = (auctionId) => api.patch(`/escrow/${auctionId}/confirm-delivery`);
export const getEscrow = (auctionId) => api.get(`/escrow/${auctionId}`);

export default api;
