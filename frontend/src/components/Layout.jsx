import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../assets/images/tse_logo.png'
import userIcon from '../assets/icons/user-icon.jpg'
import { useAuth } from '../features/auth/AuthContext'

export default function Layout({ children }) {
    const [collapsed, setCollapsed] = useState(false)
    const [isDark, setIsDark] = useState(false)
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()
    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const navUserRef = useRef(null)

    // debug: show auth state in console to help diagnose missing user-block
    // remove or guard behind env check if you don't want console output in production
    try {
        // eslint-disable-next-line no-console
        console.log('Layout auth:', { isAuthenticated, user })
    } catch (e) { }

    const toggleTheme = () => {
        const next = !isDark
        setIsDark(next)
        try {
            document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
        } catch (e) { }
    }

    useEffect(() => {
        const onDocClick = (e) => {
            if (!navUserRef.current) return
            if (!navUserRef.current.contains(e.target)) {
                setShowProfileMenu(false)
            }
        }

        document.addEventListener('mousedown', onDocClick)
        return () => document.removeEventListener('mousedown', onDocClick)
    }, [])

    const handleProfileClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setShowProfileMenu(s => !s)
    }

    const handleLogout = () => {
        try { logout() } catch (e) { }
        setShowProfileMenu(false)
        navigate('/login')
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

                    {isAuthenticated && user ? (
                        <div
                            className="nav-user"
                            ref={navUserRef}
                            onClick={handleProfileClick}
                            role="button"
                            tabIndex={0}
                            title={user && (user.userName || user.username) ? `${user.userName || user.username}` : 'Account'}
                            data-username={user && (user.userName || user.username) ? (user.userName || user.username) : ''}
                        >
                            <div className="user-block">
                                <div className="user-line1">{user.userName || user.username}{user.displayname_en ? ` | ${user.displayname_en}` : ''}</div>
                                <div className="user-line2">{user.type || ''}</div>
                            </div>
                            <img src={userIcon} alt="Avatar" className="avatar" />

                            {showProfileMenu && (
                                <div className="user-dropdown" role="menu">
                                    <div className="profile-top">
                                        <img src={userIcon} alt="Avatar" className="big-avatar" />
                                        <div className="profile-name">{user.displayname_en || user.userName || user.username}</div>
                                        <div className="profile-type">{user.type || ''}</div>
                                    </div>
                                    <div className="profile-info">
                                        {user.userName && <div className="info-row"><strong>ID</strong><span>{user.userName}</span></div>}
                                        {user.email && <div className="info-row"><strong>Email</strong><span>{user.email}</span></div>}
                                    </div>
                                    <div className="profile-actions">
                                        <button className="btn-logout" onClick={handleLogout} type="button">ออกจากระบบ</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="nav-login" onClick={() => navigate('/login')}>Login</button>
                    )}
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
