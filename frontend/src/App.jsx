import React from 'react';
import BidderDashboard from './pages/BidderDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* A temporary Navbar just so the app looks put together */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600 tracking-tight">BidMaster</span>
            </div>
            <div className="text-sm font-medium text-gray-500">
              User: Ani (Bidder View)
            </div>
          </div>
        </div>
      </nav>

      {/* This is where your Dashboard actually renders */}
      <main>
        <BidderDashboard />
      </main>
    </div>
  );
}

export default App;