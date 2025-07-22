import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create the AuthContext
const AuthContext = createContext(undefined);

/**
 * AuthProvider Component
 * 
 * This component handles user authentication state across the app.
 * It provides login, logout, registration, and user session management functionality.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure axios interceptors
  useEffect(() => {
    // Add token to requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await axios.get('/api/auth/me');
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', response.data.user.name);
      } else {
        // Invalid response, clear token
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   * 
   * DATABASE INTEGRATION POINT:
   * This authenticates the user via API and stores user token
   * 
   * Expected API endpoint: POST /api/auth/login
   * Request body: { email, password }
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Set user state
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success(`Welcome back, ${userData.name}!`);
        console.log('✅ Login successful:', userData);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      toast.error(errorMessage);
      console.error('❌ Login error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   * 
   * DATABASE INTEGRATION POINT:
   * This creates a new user account via API
   * 
   * Expected API endpoint: POST /api/auth/register
   * Request body: { name, email, password, mpesaNumber }
   * Response: { success: true, token, user: {...}, message }
   */
  const register = async (name, email, password, mpesaNumber) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        mpesaNumber
      });

      if (response.data.success) {
        const { token, user: newUser } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Set user state
        setUser(newUser);
        setIsAuthenticated(true);
        
        toast.success(`Welcome to Fintrack, ${newUser.name}!`);
        console.log('✅ Registration successful:', newUser);
        
        return { success: true, user: newUser };
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      toast.error(errorMessage);
      console.error('❌ Registration error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   * 
   * This removes the user's session from localStorage and state
   */
  const logout = async () => {
    try {
      // Call logout endpoint (optional - for server-side session cleanup)
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Always clear local state regardless of API call result
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      console.log('✅ User logged out');
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updateData) => {
    try {
      const response = await axios.put('/api/auth/profile', updateData);
      
      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Profile updated successfully');
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Update failed';
      toast.error(errorMessage);
      console.error('❌ Profile update error:', error);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Change user password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      } else {
        throw new Error(response.data.error || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password change failed';
      toast.error(errorMessage);
      console.error('❌ Password change error:', error);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};