// categoriesApiHelper.js
const API_BASE_URL = 'http://localhost:8000/api';

// Enhanced token retrieval
export const getAuthToken = () => {
  try {
    let token = localStorage.getItem('authToken');
    
    if (!token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        token = userData?.token || null;
      }
    }
    
    if (!token) {
      console.warn('No authentication token found in localStorage');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// API call helper
export const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please log in again.');
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You don\'t have permission for this action.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
};

// Demo categories data
export const getDemoCategories = () => [
  {
    _id: 'demo-1',
    name: 'Food & Dining',
    color: '#ef4444',
    budget: 5000,
    spent: 0,
    description: 'Restaurants, groceries, and food delivery',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'demo-2',
    name: 'Transportation',
    color: '#3b82f6',
    budget: 3000,
    spent: 0,
    description: 'Bus, taxi, fuel, and travel expenses',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Validate and format category data
export const validateCategory = (category) => ({
  _id: category._id || category.id,
  name: category.name || 'Unnamed Category',
  color: category.color || '#3B82F6',
  budget: Number(category.budget) || 0,
  spent: Number(category.spent) || 0,
  description: category.description || '',
  createdAt: category.createdAt,
  updatedAt: category.updatedAt
});