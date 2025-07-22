import axios from 'axios';

// Base URL for your API - adjust this to match your backend server
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout - increased for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for CORS
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url
      }
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Optionally redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email address
   * @param {string} userData.mpesaNumber - User's M-Pesa number
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    try {
      console.log('🔐 AuthService: Starting registration process');
      
      // Validate input data
      const requiredFields = ['name', 'email', 'mpesaNumber', 'password'];
      for (const field of requiredFields) {
        if (!userData[field] || !userData[field].toString().trim()) {
          throw new Error(`${field} is required`);
        }
      }

      // Clean and prepare data
      const cleanData = {
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        mpesaNumber: userData.mpesaNumber.trim(),
        password: userData.password
      };

      console.log('🔐 AuthService: Sending registration request', {
        ...cleanData,
        password: '[HIDDEN]'
      });

      const response = await apiClient.post('/auth/register', cleanData);

      console.log('✅ AuthService: Registration successful', {
        success: response.data.success,
        message: response.data.message
      });

      // Handle successful registration
      if (response.data.success) {
        return {
          success: true,
          data: response.data,
          message: response.data.message || 'Registration successful',
          user: response.data.user,
          token: response.data.token
        };
      }

      // Handle registration failure
      return {
        success: false,
        error: response.data.error || response.data.message || 'Registration failed'
      };

    } catch (error) {
      console.error('❌ AuthService: Registration error:', error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        let errorMessage = errorData?.error || errorData?.message || 'Registration failed';
        
        // Handle specific status codes
        if (status === 409) {
          errorMessage = errorData?.error || 'An account with this email or phone number already exists';
        } else if (status === 400) {
          errorMessage = errorData?.error || 'Please check your input and try again';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        return {
          success: false,
          error: errorMessage,
          status: status
        };
      } else if (error.request) {
        // Network error - no response received
        console.error('Network error:', error.request);
        return {
          success: false,
          error: 'Cannot connect to server. Please check your internet connection and try again.'
        };
      } else if (error.message) {
        // Validation or other client-side error
        return {
          success: false,
          error: error.message
        };
      } else {
        // Unknown error
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.'
        };
      }
    }
  }

  /**
   * Login user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Login response
   */
  async login(email, password) {
    try {
      console.log('🔐 AuthService: Attempting login');

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const cleanData = {
        email: email.toLowerCase().trim(),
        password: password
      };

      const response = await apiClient.post('/auth/login', cleanData);

      if (response.data.success && response.data.token) {
        // Store token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('✅ AuthService: Login successful');

        return {
          success: true,
          data: response.data,
          user: response.data.user,
          token: response.data.token,
          message: response.data.message || 'Login successful'
        };
      }

      return {
        success: false,
        error: response.data.error || response.data.message || 'Login failed'
      };

    } catch (error) {
      console.error('❌ AuthService: Login error:', error);

      if (error.response) {
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            'Invalid email or password';
        
        return {
          success: false,
          error: errorMessage,
          status: error.response.status
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Cannot connect to server. Please check your connection.'
        };
      } else {
        return {
          success: false,
          error: error.message || 'An unexpected error occurred during login.'
        };
      }
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Optionally call logout endpoint on server
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('🔐 AuthService: User logged out');
    }
  }

  /**
   * Get current user from token
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      console.error('AuthService: Get current user error:', error);
      return {
        success: false,
        error: 'Failed to get user information'
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = this.getStoredUser();
    return !!(token && user);
  }

  /**
   * Get stored user data
   * @returns {Object|null} User data
   */
  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('AuthService: Error parsing stored user:', error);
      localStorage.removeItem('user'); // Clear corrupted data
      return null;
    }
  }

  /**
   * Get stored auth token
   * @returns {string|null} Auth token
   */
  getToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Test server connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      const response = await apiClient.get('/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('AuthService: Connection test failed:', error);
      return {
        success: false,
        error: 'Cannot connect to server'
      };
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;