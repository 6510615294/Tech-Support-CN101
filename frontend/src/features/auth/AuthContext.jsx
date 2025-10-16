import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginApi } from './authService';

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

    const login = async ({ username, password }) => {
        setLoading(true);
        try {
            const res = await loginApi({ username, password });
            try {
                localStorage.setItem('token', res.token);
                if (res.user) {
                    localStorage.setItem('user', JSON.stringify(res.user));
                }
            } catch (e) {
                // ignore storage errors
            }
            setToken(res.token);
            if (res.user) setUser(res.user);
            return res;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        } catch (e) { }
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;
    const value = useMemo(() => ({ token, user, isAuthenticated, login, logout, loading }), [token, user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
