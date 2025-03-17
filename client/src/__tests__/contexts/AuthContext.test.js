// AuthContext.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// 1) Mock the navigate function from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Keep other exports from react-router-dom
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// 2) A simple test component to demonstrate usage of AuthContext
const TestComponent = () => {
  const { currentUser, token, loading, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="user">
        {currentUser ? currentUser.username : 'null'}
      </div>
      <div data-testid="token">{token || 'no-token'}</div>

      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext (without api)', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('loads user from localStorage on mount', async () => {
    // Arrange: Put a user/token in localStorage
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'storedUser' }));
    localStorage.setItem('token', 'stored-token');

    // Act: Render with MemoryRouter + AuthProvider
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Initially, loading is true
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for the effect to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Assert: The user and token were loaded from localStorage
    expect(screen.getByTestId('user').textContent).toBe('storedUser');
    expect(screen.getByTestId('token').textContent).toBe('stored-token');
  });

  test('logout removes user/token from localStorage and navigates', async () => {
    // Arrange: Put user/token in localStorage so we start "logged in"
    localStorage.setItem('user', JSON.stringify({ id: '99', username: 'LocalUser' }));
    localStorage.setItem('token', 'local-token');

    // Act: Render and wait for loading to finish
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for loading to become false
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Confirm user is currently "LocalUser"
    expect(screen.getByTestId('user').textContent).toBe('LocalUser');

    // Click Logout
    await userEvent.click(screen.getByTestId('logout-btn'));

    // Assert localStorage is cleared
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();

    // The context state should now show no user/token
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('no-token');

    // And navigation to /login should have occurred
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
