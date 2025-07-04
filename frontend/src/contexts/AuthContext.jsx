import React, { createContext, useContext, useState, useEffect } from 'react';

// User structure reference
// {
//   id: string;
//   name: string;
//   email: string;
//   token: string;
// }

const AuthContext = createContext(undefined);

/**
 * AuthProvider Component
 * 
 * This component handles user authentication state across the app.
 * It provides login, logout, and user session management functionality.
 * 
 * DATABASE / API INTEGRATION POINTS:
 * - Login should validate user credentials via API and receive a token
 * - Token should be stored in localStorage for session persistence
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // On first load, check localStorage for token and user info
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.email && parsed?.token) {
          setUser(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load user from localStorage:', error);
      localStorage.removeItem('user'); // fallback cleanup
    }
  }, []);

  /**
   * Login user
   * 
   * DATABASE INTEGRATION POINT:
   * This should authenticate the user via API and store user token
   * 
   * Expected API endpoint: POST /api/login
   * Request body: { email, password }
   */
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  /**
   * Logout user
   * 
   * This removes the user's session from localStorage and state
   */
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout
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
