import axios from 'axios';

// ✅ Updated base URL to include /api
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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

// Response interceptor
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class AuthService {
  async register(userData) {
    try {
      console.log('🔐 AuthService: Starting registration process');
      const requiredFields = ['name', 'email', 'mpesaNumber', 'password'];
      for (const field of requiredFields) {
        if (!userData[field] || !userData[field].toString().trim()) {
          throw new Error(`${field} is required`);
        }
      }
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
      if (response.data.success) {
        return {
          success: true,
          data: response.data,
          message: response.data.message || 'Registration successful',
          user: response.data.user,
          token: response.data.token
        };
      }
      return {
        success: false,
        error: response.data.error || response.data.message || 'Registration failed'
      };
    } catch (error) {
      console.error('❌ AuthService: Registration error:', error);
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        let errorMessage = errorData?.error || errorData?.message || 'Registration failed';
        if (status === 409) errorMessage = errorData?.error || 'Account already exists';
        if (status === 400) errorMessage = errorData?.error || 'Invalid input';
        if (status >= 500) errorMessage = 'Server error';
        return { success: false, error: errorMessage, status };
      } else if (error.request) {
        return { success: false, error: 'Cannot connect to server.' };
      } else {
        return { success: false, error: error.message || 'Unexpected error' };
      }
    }
  }

  async login(email, password) {
    try {
      console.log('🔐 AuthService: Attempting login');
      if (!email || !password) throw new Error('Email and password are required');
      const cleanData = { email: email.toLowerCase().trim(), password };
      const response = await apiClient.post('/auth/login', cleanData);
      if (response.data.success && response.data.token) {
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
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Login failed';
        return { success: false, error: errorMessage, status: error.response.status };
      } else if (error.request) {
        return { success: false, error: 'Cannot connect to server.' };
      } else {
        return { success: false, error: error.message || 'Unexpected login error' };
      }
    }
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('AuthService: Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('🔐 AuthService: User logged out');
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('AuthService: Get current user error:', error);
      return { success: false, error: 'Failed to get user information' };
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = this.getStoredUser();
    return !!(token && user);
  }

  getStoredUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('AuthService: Error parsing stored user:', error);
      localStorage.removeItem('user');
      return null;
    }
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  async testConnection() {
    try {
      const response = await apiClient.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AuthService: Connection test failed:', error);
      return { success: false, error: 'Cannot connect to server' };
    }
  }
}

const authService = new AuthService();
export default authService;
