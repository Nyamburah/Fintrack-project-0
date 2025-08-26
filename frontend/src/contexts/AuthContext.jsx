import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import authService from '../services/authService';

// Set base URL for axios to match your backend
axios.defaults.baseURL = 'http://localhost:8000';

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Setup axios interceptors
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('🔐 401 error detected, clearing auth state');
          handleAuthError();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Handle authentication errors
  const handleAuthError = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setError('Session expired. Please login again.');
    toast.error('Session expired. Please login again.');
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Enhanced auth status check
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Checking authentication status...');
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('❌ No token found');
        setLoading(false);
        return;
      }

      // Test server connection first
      const connectionTest = await authService.testConnection();
      if (!connectionTest.success) {
        console.error('❌ Server connection failed:', connectionTest.error);
        setError('Cannot connect to server');
        setLoading(false);
        return;
      }

      // Get current user
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        console.log('✅ User authenticated:', result.user.name);
        setUser(result.user);
        setIsAuthenticated(true);
        setError(null);
      } else {
        console.log('❌ Auth check failed:', result.error);
        handleAuthError();
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  // Enhanced login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 AuthContext: Starting login process');
      
      // Use authService for login
      const result = await authService.login(email, password);
      
      if (result.success) {
        console.log('✅ AuthContext: Login successful');
        setUser(result.user);
        setIsAuthenticated(true);
        setError(null);
        toast.success(`Welcome back, ${result.user.name}!`);
        return { success: true, user: result.user };
      } else {
        console.error('❌ AuthContext: Login failed:', result.error);
        setError(result.error);
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 AuthContext: Starting registration process');
      
      const result = await authService.register(userData);
      
      if (result.success) {
        console.log('✅ AuthContext: Registration successful');
        
        // If registration includes auto-login
        if (result.token && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
        }
        
        setError(null);
        toast.success(result.message || 'Registration successful!');
        return { success: true, user: result.user, token: result.token };
      } else {
        console.error('❌ AuthContext: Registration failed:', result.error);
        setError(result.error);
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthContext: Registration error:', error);
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout function
  const logout = async () => {
    try {
      setLoading(true);
      console.log('🔐 AuthContext: Starting logout process');
      
      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('✅ AuthContext: Logout successful');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
      // Still clear local state even if server logout fails
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } finally {
      setLoading(false);
    }
  };

  // Update user stats helper
  const updateUserStats = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return prev;
      
      const updatedUser = { ...prev, ...updates };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    });
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        handleAuthError();
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error);
      handleAuthError();
      return { success: false, error: error.message };
    }
  }, [isAuthenticated, handleAuthError]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Debug function
  const debugAuth = async () => {
    const debug = await authService.debugStatus();
    console.table({
      'Context User': !!user,
      'Context Authenticated': isAuthenticated,
      'Context Loading': loading,
      'Context Error': error,
      'Service Has Token': debug.hasToken,
      'Service Has User': debug.hasUser,
      'Service Is Authenticated': debug.isAuthenticated
    });
    return debug;
  };

  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    error,
    
    // Actions
    login,
    register,
    logout,
    checkAuthStatus,
    updateUserStats,
    refreshUser,
    clearError,
    
    // Debug
    debugAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};