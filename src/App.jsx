import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './pages/auth/Login'
import PrivateRoute from './routes/PrivateRoute'

function Home() {
    return (
        <div>
            <h1>Home (protected)</h1>
            <p>Welcome to the mock app home page.</p>
            <Link to="/login">Logout / Login</Link>
        </div>
    )
}

export default function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Home />
                    </PrivateRoute>
                }
            />
            <Route path="/login" element={<LoginPage />} />
        </Routes>
    )
}
