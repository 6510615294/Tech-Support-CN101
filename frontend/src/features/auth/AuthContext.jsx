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

    // If we have a token but no user, try to fetch detailed profile from /api/me
    useEffect(() => {
        let mounted = true
        const loadProfile = async () => {
            if (!token || user) return
            try {
                // eslint-disable-next-line no-console
                console.log('AuthProvider: loading profile with token', Boolean(token))
                const headers = { Accept: 'application/json' }
                headers['Authorization'] = `Bearer ${token}`
                const resp = await fetch('http://127.0.0.1:8080/api/me', { headers })
                if (!resp.ok) {
                    // eslint-disable-next-line no-console
                    console.warn('AuthProvider: /api/me returned', resp.status)
                    return
                }
                const data = await resp.json()
                // eslint-disable-next-line no-console
                console.log('AuthProvider: profile loaded', data)
                if (mounted) {
                    setUser(data)
                    try { localStorage.setItem('user', JSON.stringify(data)) } catch (e) { }
                }
            } catch (e) {
                // log profile fetch errors for easier debugging
                // eslint-disable-next-line no-console
                console.error('Failed to load profile in AuthProvider', e)
            }
        }

        loadProfile()
        return () => { mounted = false }
    }, [token])

    // helper to set profile from other parts of the app (e.g., pages that fetch /api/me)
    const setProfile = (profile) => {
        try {
            setUser(profile)
            localStorage.setItem('user', JSON.stringify(profile))
        } catch (e) {
            // ignore storage errors
        }
    }

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
    const value = useMemo(() => ({ token, user, isAuthenticated, login, logout, loading, setProfile }), [token, user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
