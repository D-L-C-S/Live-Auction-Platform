import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import BidderDashboard from './pages/BidderDashboard';
import AuctionListingPage from './pages/AuctionListingPage';
import AuctionPage from './pages/AuctionPage';
import SellerDashboard from './pages/SellerDashboard';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    // SocketProvider connects socket.io once and shares it via context
    <SocketProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          {/* Navbar */}
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-8">
                  <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight">
                    BidMaster
                  </Link>
                  {/* Nav links */}
                  <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
                    <Link to="/" className="hover:text-blue-600 transition-colors">
                      Dashboard
                    </Link>
                    <Link to="/auctions" className="hover:text-blue-600 transition-colors">
                      Browse Auctions
                    </Link>
                    <Link to="/seller" className="hover:text-blue-600 transition-colors">
                      Sell
                    </Link>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-500">
                  User: Charan (Bidder View)
                </div>
              </div>
            </div>
          </nav>

          {/* Page content */}
          <main>
            <Routes>
              <Route path="/" element={<BidderDashboard />} />
              <Route path="/auctions" element={<AuctionListingPage />} />
              <Route path="/auctions/:id" element={<AuctionPage />} />
              <Route path="/seller" element={<SellerDashboard />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
