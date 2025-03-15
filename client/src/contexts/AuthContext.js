/**
 * Authentication context for the Clue-Less client
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Register a new user
  const register = async (username, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Login a user
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });
      
      const { token, userId, username: userName } = response.data;
      
      // Store user data and token
      const user = { id: userId, username: userName };
      setCurrentUser(user);
      setToken(token);
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Logout a user
  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Update API token when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Context value
  const value = {
    currentUser,
    token,
    loading,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 