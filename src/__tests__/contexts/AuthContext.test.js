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
});

describe('AuthContext', () => {
  describe('Initial Load', () => {
    test('starts with loading=false and checks localStorage', async () => {
      const mockUser = { id: 'user123', username: 'StoredUser' };
      const mockToken = 'storedToken123';
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', mockToken);

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

    test('starts with loading=false and no user if localStorage is empty', async () => {
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
    test('successful registration calls api and returns success', async () => {
      api.post.mockResolvedValue({ data: { message: 'User registered' } });

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('register-btn'));
      });

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@test.com',
        password: 'password'
      });
    });

    test('failed registration returns error', async () => {
      const errorMessage = 'Registration Failed';
      api.post.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
        
      await act(async () => {
         await userEvent.click(screen.getByTestId('register-btn'));
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

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await act(async () => {
        await userEvent.click(screen.getByTestId('login-btn'));
      });

      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
      expect(screen.getByTestId('token').textContent).toBe(mockToken);
      
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
        await userEvent.click(screen.getByTestId('login-btn'));
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
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', mockToken);

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser)));

      await act(async () => {
         userEvent.click(screen.getByTestId('logout-btn'));
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('no-token');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
}); 