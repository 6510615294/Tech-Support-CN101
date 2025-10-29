import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../assets/images/tse_logo.png'

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false)
    const [isDark, setIsDark] = useState(false)
    const navigate = useNavigate()

    const toggleTheme = () => {
        const next = !isDark
        setIsDark(next)
        try {
            document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
        } catch (e) { }
    }

    return (
        <div className="app-layout" style={{ ['--sidebar-width']: collapsed ? '64px' : '220px' }}>
            <nav className="top-nav">
                <div className="nav-left">Tech-Support</div>
                <div className="nav-right">
                    <select className="lang-select" aria-label="Language">
                        <option value="th">TH</option>
                        <option value="en">EN</option>
                    </select>
                    <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">{isDark ? '☾' : '☀'}</button>
                    <button className="nav-login" onClick={() => navigate('/login')}>Login</button>
                </div>
            </nav>

            <div className="layout-body">
                <aside className={`side-bar ${collapsed ? 'collapsed' : ''}`}>
                    <div className="sidebar-top">
                        <img src={logo} alt="TSE logo" className="sidebar-logo" />
                        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
                            {collapsed ? '»' : '«'}
                        </button>
                    </div>
                    <ul className="sidebar-menu">
                        <li className="sidebar-item"><Link to="/">Home</Link></li>
                        <li className="sidebar-item"><Link to="/login">Login</Link></li>
                    </ul>
                </aside>

                <main className="main-content">
                    {children}
                </main>
            </div>

            <footer className="site-footer">
                <div className="container">Department of Electrical and Computer Engineering, Thammasat University.</div>
            </footer>
        </div>
    )
}
