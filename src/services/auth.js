export async function loginApi({ email, password }) {
  // Production: call the real backend endpoint
  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || 'Login failed');
    }
    return await resp.json(); // expected shape: { token: '...', user: {...} }
  } catch (err) {
    // Dev convenience: allow a mock auth flow when localStorage.MOCK_AUTH === '1'
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('MOCK_AUTH') === '1') {
        // simple mock: accept any non-empty credentials and return a fake token
        if (!email || !password) throw new Error('Invalid credentials');
        return Promise.resolve({ token: 'mock-token-123', user: { email } });
      }
    } catch (e) {
      // ignore localStorage errors
    }

    // rethrow the original error for callers to handle
    throw err;
  }
}