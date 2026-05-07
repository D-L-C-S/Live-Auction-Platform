import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name,     setName]     = useState('');
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
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
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

      if (!res.ok) throw new Error(data.message || 'Registration failed.');
      if (!data.token || typeof data.token !== 'string' || data.token.split('.').length !== 3) {
        throw new Error('Registration failed: server did not return a valid token.');
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
    <div className="min-h-screen flex items-center justify-center auth-bg px-4">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="bg-[#161622] border border-[#2a2a3d] rounded-2xl p-8 shadow-2xl shadow-black/60">
          <div className="text-center mb-6">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              BidMaster
            </span>
            <p className="text-sm text-gray-500 mt-1">Create your account</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4 animate-slide-down">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="input-dark w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Email
              </label>
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
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-dark w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-2.5 rounded-xl text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
