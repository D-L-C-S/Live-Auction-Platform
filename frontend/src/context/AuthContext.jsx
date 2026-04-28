import React, { createContext, useContext, useState } from 'react';

// Decodes the payload of a JWT without any external library.
function decodeJWT(token) {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return null;
  }
}

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
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
