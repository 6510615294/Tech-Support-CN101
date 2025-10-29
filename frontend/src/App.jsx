import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import LoginPage from './features/auth/Login'
import PrivateRoute from './routes/PrivateRoute'
import Home from './pages/Home'
import Dashboard from './pages/Student-dashboard'
import CoursesPage from './features/courses/Courses'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/courses"
                element={
                    <PrivateRoute>
                        <CoursesPage />
                    </PrivateRoute>
                }
            />
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
