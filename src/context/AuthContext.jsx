import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginApi } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // optional: could validate token here with backend
  }, []);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      try {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user || { email }));
      } catch (e) {
        // ignore storage errors
      }
      setToken(res.token);
      setUser(res.user || { email });
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, login, logout, loading }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);