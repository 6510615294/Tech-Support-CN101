export async function loginApi({ username, password }) {
    try {
        const resp = await fetch('http://127.0.0.1:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(text || 'Login failed');
        }

        return await resp.json(); // expected shape: { token: '...', user: {...} }
    } catch (err) {
        console.error('Login API error:', err);
        throw err;
    }
}