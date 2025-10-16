import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login({ email, password }); // login should store token and resolve
            navigate('/dashboard'); // redirect after login
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={submit}>
                <label>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} />
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="submit">Sign in</button>
                {error && <div style={{ color: 'red' }}>{error}</div>}
            </form>
        </div>
    );
}
