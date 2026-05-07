import React from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import BidderDashboard from './pages/BidderDashboard';
import AuctionListingPage from './pages/AuctionListingPage';
import AuctionPage from './pages/AuctionPage';
import SellerDashboard from './pages/SellerDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PaymentReceiptPage from './pages/PaymentReceiptPage';
import AuctionCertificatePage from './pages/AuctionCertificatePage';

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

  const displayName = authUser?.name || authUser?.email || 'Account';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-14 border-b border-[#222] bg-[#080808]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Left — logo + nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shrink-0
                            group-hover:bg-[#e8e8e8] transition-colors duration-150">
              <span className="text-[#080808] text-[10px] font-black tracking-tight select-none">BM</span>
            </div>
            <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-white
                             group-hover:text-[#ccc] transition-colors duration-150">
              BidMaster
            </span>
          </Link>

          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-6">
              <NavLink
                to="/auctions"
                className={({ isActive }) =>
                  `text-[13px] font-medium tracking-[0.02em] transition-colors duration-150
                   ${isActive ? 'text-white' : 'text-[#888] hover:text-[#ccc]'}`
                }
              >
                Browse
              </NavLink>
              <NavLink
                to="/seller"
                className={({ isActive }) =>
                  `text-[13px] font-medium tracking-[0.02em] transition-colors duration-150
                   ${isActive ? 'text-white' : 'text-[#888] hover:text-[#ccc]'}`
                }
              >
                Sell
              </NavLink>
            </div>
          )}
        </div>

        {/* Right — auth controls */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-[12px] text-[#999] hidden sm:block max-w-[140px] truncate">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="text-[12px] font-medium text-[#999] hover:text-[#f0f0f0]
                           transition-colors duration-150"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[13px] font-medium text-[#888] hover:text-[#f0f0f0]
                           transition-colors duration-150"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-[12px] font-semibold bg-white text-[#080808] px-4 py-1.5
                           rounded-md hover:bg-[#e8e8e8] active:scale-[0.98]
                           transition-all duration-150"
              >
                Register
              </Link>
            </>
          )}
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
          <div className="min-h-screen bg-[#080808]">
            <NavBar />
            {/* Offset for fixed nav */}
            <main className="pt-14">
              <Routes>
                <Route path="/login"        element={<LoginPage />} />
                <Route path="/register"     element={<RegisterPage />} />
                <Route path="/"             element={<ProtectedRoute><BidderDashboard /></ProtectedRoute>} />
                <Route path="/auctions"     element={<ProtectedRoute><AuctionListingPage /></ProtectedRoute>} />
                <Route path="/auctions/:id" element={<ProtectedRoute><AuctionPage /></ProtectedRoute>} />
                <Route path="/seller"       element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                <Route path="/receipt"      element={<PaymentReceiptPage />} />
                <Route path="/certificate"  element={<AuctionCertificatePage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
