import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        throw new Error('Cannot reach the server. Make sure the backend is running.');
      }

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Server returned an unexpected response. Check that MongoDB is running.');
      }

      if (!res.ok) throw new Error(data.message || 'Login failed.');
      if (!data.token || typeof data.token !== 'string' || data.token.split('.').length !== 3) {
        throw new Error('Login failed: server did not return a valid token.');
      }

      if (data.user) localStorage.setItem('authUser', JSON.stringify(data.user));
      login(data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center auth-bg grid-texture px-4 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
                        bg-cyan-400/[0.04] blur-[80px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[380px]"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white mb-4">
            <span className="text-[#080808] text-sm font-black tracking-tight">BM</span>
          </div>
          <h1 className="text-xl font-bold tracking-[-0.02em] text-white">Sign in to BidMaster</h1>
          <p className="text-[13px] text-[#999] mt-1">Enter the auction room</p>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-[#2e2e2e] rounded-2xl p-7 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/8 border border-red-500/20 text-red-400 text-[13px]
                         px-4 py-3 rounded-lg mb-5"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-dark w-full"
              />
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-dark w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 rounded-xl text-[13px] mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#080808]/30 border-t-[#080808] rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#222] text-center">
            <p className="text-[13px] text-[#999]">
              No account?{' '}
              <Link to="/register" className="text-[#f0f0f0] hover:text-white font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
