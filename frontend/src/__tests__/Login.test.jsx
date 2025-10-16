import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../features/auth/Login';
import { AuthProvider } from '../features/auth/AuthContext';

describe('Login page', () => {
  test('renders login form and submits', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const email = screen.getByLabelText(/email/i);
    const pass = screen.getByLabelText(/password/i);
    const btn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(email, { target: { value: 'test@example.com' } });
    fireEvent.change(pass, { target: { value: 'password' } });
    fireEvent.click(btn);

    // We just assert no crash and button exists.
    expect(btn).toBeInTheDocument();
  });
});
