import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './features/auth/Login'
import PrivateRoute from './routes/PrivateRoute'
import Landing from './features/landing/Landing'
import Dashboard from './features/dashboard/Dashboard'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
        </Routes>
    )
}
