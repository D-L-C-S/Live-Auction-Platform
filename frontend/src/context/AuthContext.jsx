import React, { createContext, useContext, useState } from 'react';

// Decodes the payload of a JWT without any external library.
// JWTs use base64url encoding (not standard base64): must replace - with +
// and _ with /, then add = padding so atob() can parse it correctly.
function decodeJWT(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) base64 += '=';

    return JSON.parse(atob(base64));
  } catch (e) {
    return null;
  }
}

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    // Clear any stale junk (e.g. the literal string "undefined") from a previous bad session.
    if (!stored || stored === 'undefined' || stored.split('.').length !== 3) {
      localStorage.removeItem('token');
      return null;
    }
    return stored;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('token');
    return stored ? decodeJWT(stored) : null;
  });

  // Stores the JWT, decodes it, and updates state.
  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setCurrentUser(decodeJWT(newToken));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    setToken(null);
    setCurrentUser(null);
  };

  const isAuthenticated = !!token && !!currentUser;

  return (
    <AuthContext.Provider value={{ token, currentUser, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
