/**
 * Authentication context provider.
 * Manages user authentication state and provides auth functions.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, usersAPI } from '../services/api';
import wsService from '../services/websocket';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          
          // Verify token is still valid
          await authAPI.verifyToken();
          
          // Connect to WebSocket
          wsService.connect(savedToken);
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login user.
   */
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, user: userData } = response.data;

      // Save to state and localStorage
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Connect to WebSocket
      wsService.connect(access_token);

      toast.success('Login successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  /**
   * Register new user.
   */
  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { access_token, user: userData } = response.data;

      // Save to state and localStorage
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Connect to WebSocket
      wsService.connect(access_token);

      toast.success('Registration successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  /**
   * Logout user.
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Disconnect WebSocket
    wsService.disconnect();
    
    toast.success('Logged out successfully');
  };

  /**
   * Refresh user data.
   */
  const refreshUser = async () => {
    try {
      const response = await usersAPI.getCurrentUser();
      const userData = response.data;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
