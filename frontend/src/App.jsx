import React from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import BidderDashboard from './pages/BidderDashboard';
import AuctionListingPage from './pages/AuctionListingPage';
import AuctionPage from './pages/AuctionPage';
import SellerDashboard from './pages/SellerDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const authUser = (() => {
    try {
      const raw = localStorage.getItem('authUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const displayName = authUser?.name || authUser?.email || 'My Account';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#0d0d14]/90 backdrop-blur-md border-b border-[#2a2a3d] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent hover:from-violet-300 hover:to-blue-300 transition-all duration-200"
            >
              BidMaster
            </Link>

            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
                <Link
                  to="/auctions"
                  className="text-gray-400 hover:text-violet-400 transition-colors duration-150 relative group"
                >
                  Browse Auctions
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-blue-500 group-hover:w-full transition-all duration-200" />
                </Link>
                <Link
                  to="/seller"
                  className="text-gray-400 hover:text-violet-400 transition-colors duration-150 relative group"
                >
                  Sell
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-violet-500 to-blue-500 group-hover:w-full transition-all duration-200" />
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <span className="text-gray-400 hidden sm:block">{displayName}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-400 transition-colors duration-150 border border-[#2a2a3d] hover:border-red-500/40 px-3 py-1.5 rounded-lg"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-violet-400 transition-colors duration-150"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-gradient px-4 py-1.5 rounded-lg text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#0d0d14]">
            <NavBar />
            <main>
              <Routes>
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/"         element={<ProtectedRoute><BidderDashboard /></ProtectedRoute>} />
                <Route path="/auctions" element={<ProtectedRoute><AuctionListingPage /></ProtectedRoute>} />
                <Route path="/auctions/:id" element={<ProtectedRoute><AuctionPage /></ProtectedRoute>} />
                <Route path="/seller"   element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
