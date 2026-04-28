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

// NavBar is a separate component so it can use useNavigate (requires BrowserRouter above it).
function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // authUser is stored by LoginPage/RegisterPage after a successful auth call.
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
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight">
              BidMaster
            </Link>
            {/* Nav links — only show when authenticated */}
            {isAuthenticated && (
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
            )}
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <span className="text-gray-600">{displayName}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="min-h-screen bg-gray-50">
            <NavBar />
            <main>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><BidderDashboard /></ProtectedRoute>} />
                <Route path="/auctions" element={<ProtectedRoute><AuctionListingPage /></ProtectedRoute>} />
                <Route path="/auctions/:id" element={<ProtectedRoute><AuctionPage /></ProtectedRoute>} />
                <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
