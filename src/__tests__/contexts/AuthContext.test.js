import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

jest.mock('../../utils/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const TestComponent = () => {
  const { currentUser, token, loading, login, logout, register } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{JSON.stringify(currentUser)}</div>
      <div data-testid="token">{token || 'no-token'}</div>
      <button data-testid="login-btn" onClick={async () => { 
        await login('testuser', 'password'); 
      }}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
      <button data-testid="register-btn" onClick={async () => { 
        await register('newuser', 'new@test.com', 'password'); 
      }}>Register</button>
    </div>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  api.post.mockReset();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

describe('AuthContext', () => {
  describe('Initial Load', () => {
    test('initially loading becomes false, checks localStorage, reflects stored data', async () => {
      const mockUser = { id: 'user123', username: 'StoredUser' };
      const mockToken = 'storedToken123';
      window.localStorage.getItem
        .mockImplementation(key => {
          if (key === 'user') return JSON.stringify(mockUser);
          if (key === 'token') return mockToken;
          return null;
        });

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
      expect(screen.getByTestId('token').textContent).toBe(mockToken);
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
      expect(localStorage.getItem).toHaveBeenCalledWith('token');
    });

    test('initially loading becomes false, no user/token if localStorage is empty', async () => {
       window.localStorage.getItem.mockReturnValue(null);

       render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('no-token');
    });
  });

  describe('Registration', () => {
    test('successful registration calls api', async () => {
      api.post.mockResolvedValue({ data: { message: 'User registered' } });
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await act(async () => {
        await user.click(screen.getByTestId('register-btn'));
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@test.com',
        password: 'password'
      });
    });

    test('failed registration calls api', async () => {
      const errorMessage = 'Registration Failed';
      api.post.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
        
      await act(async () => {
         await user.click(screen.getByTestId('register-btn'));
      });
       
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@test.com',
        password: 'password'
      });
    });
  });

  describe('Login', () => {
    test('successful login updates context and localStorage', async () => {
      const mockUser = { id: 'user123', username: 'testuser' };
      const mockToken = 'testToken123';
      api.post.mockResolvedValue({ 
        data: { userId: mockUser.id, username: mockUser.username, token: mockToken }
      });
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await act(async () => {
        await user.click(screen.getByTestId('login-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
        expect(screen.getByTestId('token').textContent).toBe(mockToken);
      });
      
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(api.post).toHaveBeenCalledWith('/auth/login', { 
        username: 'testuser', 
        password: 'password' 
      });
    });

    test('failed login does not update context', async () => {
       const errorMessage = 'Invalid credentials';
       api.post.mockRejectedValue({ 
         response: { data: { message: errorMessage } } 
       });
       const user = userEvent.setup();
       render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('no-token');

      await act(async () => {
        await user.click(screen.getByTestId('login-btn'));
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('no-token');
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith('/auth/login', { 
        username: 'testuser', 
        password: 'password' 
      });
    });
  });

  describe('Logout', () => {
    test('logout clears context, localStorage and navigates', async () => {
      const mockUser = { id: 'user123', username: 'testuser' };
      const mockToken = 'testToken123';
      window.localStorage.getItem
        .mockImplementation(key => {
          if (key === 'user') return JSON.stringify(mockUser);
          if (key === 'token') return mockToken;
          return null;
        });
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser)));

      await act(async () => {
         await user.click(screen.getByTestId('logout-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(screen.getByTestId('token').textContent).toBe('no-token');
      });
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });
}); 