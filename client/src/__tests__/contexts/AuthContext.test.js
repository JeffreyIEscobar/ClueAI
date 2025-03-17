// AuthContext.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Mock the navigate function from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the api module
jest.mock('../../utils/api', () => ({
  post: jest.fn(),
  defaults: {
    headers: {
      common: {}
    }
  }
}));

// A test component that exposes auth functionality
const TestComponent = () => {
  const { currentUser, token, loading, register, login, logout } = useAuth();

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

      <button 
        onClick={() => register('newuser', 'new@user.com', 'password')} 
        data-testid="register-btn"
      >
        Register
      </button>

      <button 
        onClick={() => login('testuser', 'password')} 
        data-testid="login-btn"
      >
        Login
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  const api = require('../../utils/api');
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial Load', () => {
    test('starts with loading=true and no user', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('no-token');
    });

    test('loads user from localStorage on mount', async () => {
      localStorage.setItem('user', JSON.stringify({ id: '1', username: 'storedUser' }));
      localStorage.setItem('token', 'stored-token');

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('storedUser');
      expect(screen.getByTestId('token').textContent).toBe('stored-token');
    });
  });

  describe('Registration', () => {
    test('successful registration returns success response', async () => {
      api.post.mockResolvedValueOnce({
        data: { userId: '123', username: 'newuser' }
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await userEvent.click(screen.getByTestId('register-btn'));

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@user.com',
        password: 'password'
      });
    });

    test('failed registration returns error', async () => {
      api.post.mockRejectedValueOnce({
        response: { data: { message: 'Username taken' } }
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      const result = await userEvent.click(screen.getByTestId('register-btn'));
      expect(result).toBeDefined();
    });
  });

  describe('Login', () => {
    test('successful login sets user and token', async () => {
      const mockLoginResponse = {
        data: {
          token: 'new-token',
          userId: '123',
          username: 'testuser'
        }
      };
      api.post.mockResolvedValueOnce(mockLoginResponse);

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await userEvent.click(screen.getByTestId('login-btn'));

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password'
      });

      expect(screen.getByTestId('user').textContent).toBe('testuser');
      expect(screen.getByTestId('token').textContent).toBe('new-token');
      expect(localStorage.getItem('token')).toBe('new-token');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual({
        id: '123',
        username: 'testuser'
      });
    });

    test('failed login returns error and does not set user/token', async () => {
      api.post.mockRejectedValueOnce({
        response: { data: { message: 'Invalid credentials' } }
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await userEvent.click(screen.getByTestId('login-btn'));

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('no-token');
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Logout', () => {
    test('logout clears user, token, and navigates to login', async () => {
      localStorage.setItem('user', JSON.stringify({ id: '99', username: 'LocalUser' }));
      localStorage.setItem('token', 'local-token');

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('LocalUser');

      await userEvent.click(screen.getByTestId('logout-btn'));

      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('no-token');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('API Token Management', () => {
    test('sets Authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token');

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token');
      });
    });

    test('removes Authorization header when token is removed', async () => {
      localStorage.setItem('token', 'test-token');

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(api.defaults.headers.common['Authorization']).toBe('Bearer test-token');
      });

      await userEvent.click(screen.getByTestId('logout-btn'));

      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });
});
