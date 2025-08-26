import axios from 'axios';

// Enhanced AuthService with better error handling and debugging
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with enhanced configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
});

// Enhanced request interceptor with better logging
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Enhanced logging
    console.group(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.log('Full URL:', `${config.baseURL}${config.url}`);
    console.groupEnd();
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.group(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.groupEnd();
    return response;
  },
  (error) => {
    console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.log('Error Message:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Response Data:', error.response?.data);
    console.log('Request Config:', {
      method: error.config?.method,
      url: error.config?.url,
      data: error.config?.data,
      headers: error.config?.headers
    });
    console.groupEnd();

    // Handle 401 errors
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on auth pages
      const currentPath = window.location.pathname;
      if (!['/login', '/register', '/'].includes(currentPath)) {
        console.log('🔐 Redirecting to login due to 401 error');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

class EnhancedAuthService {
  
  // Test server connectivity
  async testConnection() {
    try {
      console.log('🔗 Testing server connection...');
      const response = await apiClient.get('/health');
      console.log('✅ Server connection successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error),
        details: error.response?.data || error.message
      };
    }
  }

  // Enhanced registration with validation
  async register(userData) {
    try {
      console.log('🔐 Starting registration process...');
      
      // Validate required fields
      const requiredFields = ['name', 'email', 'mpesaNumber', 'password'];
      const missingFields = requiredFields.filter(field => 
        !userData[field] || !userData[field].toString().trim()
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Clean and validate data
      const cleanData = {
        name: userData.name.toString().trim(),
        email: userData.email.toString().toLowerCase().trim(),
        mpesaNumber: userData.mpesaNumber.toString().trim(),
        password: userData.password.toString()
      };

      // Email validation - more flexible
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanData.email || cleanData.email.trim().length === 0) {
        throw new Error('Please enter an email address');
      }
      if (!emailRegex.test(cleanData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // M-Pesa number validation (basic)
      if (!/^254\d{9}$/.test(cleanData.mpesaNumber.replace(/\s+/g, ''))) {
        throw new Error('M-Pesa number must be in format 254XXXXXXXXX');
      }

      console.log('📤 Sending registration request:', {
        ...cleanData,
        password: '[HIDDEN]'
      });

      const response = await apiClient.post('/auth/register', cleanData);
      
      if (response.data.success) {
        console.log('✅ Registration successful');
        
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return {
          success: true,
          data: response.data,
          user: response.data.user,
          token: response.data.token,
          message: response.data.message || 'Registration successful'
        };
      }
      
      return {
        success: false,
        error: response.data.error || response.data.message || 'Registration failed'
      };
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      return this.handleError(error, 'Registration failed');
    }
  }

  // Enhanced login with better validation
  async login(email, password) {
    try {
      console.log('🔐 Starting login process...');
      
      // Enhanced validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const emailStr = String(email || '').trim();
      const passwordStr = String(password || '').trim();

      if (!emailStr || !passwordStr) {
        throw new Error('Email and password cannot be empty');
      }

      // Email format validation - more flexible and helpful
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailStr || emailStr.trim().length === 0) {
        throw new Error('Please enter an email address');
      }
      
      const trimmedEmail = emailStr.trim();
      if (!emailRegex.test(trimmedEmail)) {
        // More helpful error message
        if (!trimmedEmail.includes('@')) {
          throw new Error('Please enter a valid email address (must include @)');
        } else if (!trimmedEmail.includes('.')) {
          throw new Error('Please enter a valid email address (must include domain like .com)');
        } else {
          throw new Error(`Please enter a valid email address. You entered: "${trimmedEmail}"`);
        }
      }

      const loginData = {
        email: emailStr.toLowerCase(),
        password: passwordStr
      };

      console.log('📤 Sending login request:', {
        email: loginData.email,
        password: '[HIDDEN]'
      });

      const response = await apiClient.post('/auth/login', loginData);
      
      if (response.data.success && response.data.token) {
        console.log('✅ Login successful');
        
        // Store authentication data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
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
      console.error('❌ Login error:', error);
      return this.handleError(error, 'Login failed');
    }
  }

  // Enhanced logout
  async logout() {
    try {
      console.log('🔐 Starting logout process...');
      
      // Try to notify server (don't fail if this fails)
      try {
        await apiClient.post('/auth/logout');
        console.log('✅ Server logout successful');
      } catch (error) {
        console.warn('⚠️ Server logout failed (continuing anyway):', error.message);
      }
      
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('🔐 Local logout completed');
    }
  }

  // Enhanced current user fetching
  async getCurrentUser() {
    try {
      console.log('👤 Fetching current user...');
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('❌ No token found');
        return { success: false, error: 'No authentication token' };
      }

      const response = await apiClient.get('/auth/me');
      
      if (response.data.success || response.data.user) {
        console.log('✅ Current user fetched successfully');
        
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return { 
          success: true, 
          user: response.data.user 
        };
      }
      
      return { 
        success: false, 
        error: 'Failed to get user information' 
      };
      
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return this.handleError(error, 'Failed to get user information');
    }
  }

  // Enhanced authentication check
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = this.getStoredUser();
    const isAuth = !!(token && user);
    
    console.log('🔍 Authentication check:', {
      hasToken: !!token,
      hasUser: !!user,
      isAuthenticated: isAuth
    });
    
    return isAuth;
  }

  // Enhanced user retrieval
  getStoredUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      return user;
    } catch (error) {
      console.error('❌ Error parsing stored user:', error);
      localStorage.removeItem('user');
      return null;
    }
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Enhanced error handling
  handleError(error, defaultMessage = 'An error occurred') {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const errorData = error.response.data;
      let errorMessage = errorData?.error || errorData?.message || defaultMessage;
      
      // Customize messages based on status
      switch (status) {
        case 400:
          errorMessage = errorData?.error || 'Invalid request data';
          break;
        case 401:
          errorMessage = errorData?.error || 'Invalid credentials';
          break;
        case 403:
          errorMessage = errorData?.error || 'Access denied';
          break;
        case 409:
          errorMessage = errorData?.error || 'Account already exists';
          break;
        case 422:
          errorMessage = errorData?.error || 'Validation failed';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = errorData?.error || errorData?.message || defaultMessage;
      }
      
      return { 
        success: false, 
        error: errorMessage, 
        status,
        details: errorData
      };
      
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      return { 
        success: false, 
        error: 'Cannot connect to server. Please check your internet connection.',
        networkError: true
      };
      
    } else {
      // Other error
      return { 
        success: false, 
        error: error.message || defaultMessage 
      };
    }
  }

  // Get error message helper
  getErrorMessage(error) {
    if (error.response?.data?.error) return error.response.data.error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
  }

  // Debug method to check service status
  async debugStatus() {
    console.group('🔍 Auth Service Debug Status');
    
    // Check local storage
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    console.log('Local Storage:');
    console.log('- Token:', token ? `${token.substring(0, 20)}...` : 'None');
    console.log('- User:', user ? 'Present' : 'None');
    
    // Test connection
    const connectionTest = await this.testConnection();
    console.log('Connection Test:', connectionTest);
    
    // Test authentication if token exists
    if (token) {
      const userTest = await this.getCurrentUser();
      console.log('User Fetch Test:', userTest);
    }
    
    console.groupEnd();
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      connection: connectionTest,
      isAuthenticated: this.isAuthenticated()
    };
  }
}

const authService = new EnhancedAuthService();
export default authService;