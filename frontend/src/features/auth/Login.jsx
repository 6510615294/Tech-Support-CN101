import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login({ username: email, password });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <Layout>
            <div className="login-page">
                <div className="login-card">
                    <h2>Sign in</h2>
                    <form onSubmit={submit}>
                        <div className="form-field">
                            <label htmlFor="email">Student ID</label>
                            <input id="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="password">Password</label>
                            <div className="password-field">
                                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} />
                                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">{showPassword ? '🙈' : '👁'}</button>
                            </div>
                        </div>
                        <button type="submit" className="login-btn">Sign in</button>
                        {error && <div className="form-error">{error}</div>}

                        <div className="login-help">
                            <a href="https://accounts.tu.ac.th/Login.aspx" target="_blank" rel="noopener noreferrer">Change password</a>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
