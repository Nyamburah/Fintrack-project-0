// services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to get auth token (compatible with your existing setup)
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return token;
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    // Handle different error types
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - clearing auth state');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    
    const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  return data;
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, config);
    console.log(`📥 Response status: ${response.status}`);
    
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ API Request failed:', error);
    
    // Re-throw with more context for network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection and server status');
    }
    
    throw error;
  }
};

// Transactions API - matches your TransactionsPage expectations
export const transactionsAPI = {
  // Get all transactions with filtering and pagination
  getTransactions: async (params = {}) => {
    try {
      // Filter out empty params
      const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const queryString = new URLSearchParams(cleanParams).toString();
      const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiRequest(endpoint);
      
      // Handle the response structure from your backend
      if (response.success && response.data) {
        return response.data; // Should contain { transactions: [...], pagination: {...} }
      }
      
      // If no success field, assume direct data return
      if (response.transactions || Array.isArray(response)) {
        return {
          transactions: response.transactions || response,
          pagination: response.pagination || {}
        };
      }
      
      throw new Error(response.error || 'Failed to fetch transactions');
      
    } catch (error) {
      console.error('❌ getTransactions error:', error);
      throw error;
    }
  },

  // Create new transaction - for manual entry from TransactionsPage
  createTransaction: async (transactionData) => {
    try {
      // Prepare payload to match your backend expectations
      const payload = {
        amount: parseFloat(transactionData.amount),
        description: transactionData.description?.trim(),
        transactionType: transactionData.transactionType || (transactionData.type === 'income' ? 'credit' : 'debit'),
        type: transactionData.type, // Keep both for compatibility
        transactionDate: transactionData.transactionDate || transactionData.date || new Date().toISOString(),
        date: transactionData.date || transactionData.transactionDate || new Date().toISOString(), // Keep both
        category: transactionData.category || null,
        mpesaReceiptNumber: transactionData.mpesaReceiptNumber || `MANUAL_${Date.now()}`,
        senderName: transactionData.senderName || 'Manual Entry',
        senderPhone: transactionData.senderPhone || '',
        phoneNumber: transactionData.phoneNumber || transactionData.senderPhone || '',
        notes: transactionData.notes || '',
        tags: transactionData.tags || [],
        isLabeled: !!transactionData.category,
        source: 'manual' // Indicate this is a manual entry
      };

      console.log('📤 Creating transaction with payload:', payload);

      const response = await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Handle different response structures
      if (response.success) {
        return response.data;
      } else if (response.transaction || response._id) {
        return response; // Direct transaction object
      }
      
      throw new Error(response.error || 'Failed to create transaction');
      
    } catch (error) {
      console.error('❌ createTransaction error:', error);
      throw error;
    }
  },

  // Update entire transaction
  updateTransaction: async (transactionId, updateData) => {
    try {
      const payload = {
        ...updateData,
        ...(updateData.amount && { amount: parseFloat(updateData.amount) }),
        ...(updateData.description && { description: updateData.description.trim() }),
        updatedAt: new Date().toISOString()
      };

      const response = await apiRequest(`/transactions/${transactionId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (response.success) {
        return response.data;
      } else if (response.transaction || response._id) {
        return response;
      }
      
      throw new Error(response.error || 'Failed to update transaction');
      
    } catch (error) {
      console.error('❌ updateTransaction error:', error);
      throw error;
    }
  },

  // Update transaction category only
  updateCategory: async (transactionId, category) => {
    try {
      const response = await apiRequest(`/transactions/${transactionId}/category`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          category,
          isLabeled: !!category,
          updatedAt: new Date().toISOString()
        })
      });
      
      if (response.success) {
        return response.data;
      } else if (response.transaction || response._id) {
        return response;
      }
      
      throw new Error(response.error || 'Failed to update category');
      
    } catch (error) {
      console.error('❌ updateCategory error:', error);
      throw error;
    }
  },

  // Delete transaction
  deleteTransaction: async (transactionId) => {
    try {
      const response = await apiRequest(`/transactions/${transactionId}`, {
        method: 'DELETE'
      });
      
      if (response.success || response.deleted) {
        return response;
      }
      
      throw new Error(response.error || 'Failed to delete transaction');
      
    } catch (error) {
      console.error('❌ deleteTransaction error:', error);
      throw error;
    }
  },

  // Get single transaction
  getTransaction: async (transactionId) => {
    try {
      const response = await apiRequest(`/transactions/${transactionId}`);
      
      if (response.success) {
        return response.data;
      } else if (response.transaction || response._id) {
        return response;
      }
      
      throw new Error(response.error || 'Transaction not found');
      
    } catch (error) {
      console.error('❌ getTransaction error:', error);
      throw error;
    }
  },

  // Get transaction statistics
  getTransactionStats: async (period = '30d') => {
    try {
      const response = await apiRequest(`/transactions/stats?period=${period}`);
      
      if (response.success) {
        return response.data;
      } else if (response.stats) {
        return response.stats;
      }
      
      return response; // Assume direct stats object
      
    } catch (error) {
      console.error('❌ getTransactionStats error:', error);
      throw error;
    }
  },

  // Bulk update categories
  bulkUpdateCategories: async (updates) => {
    try {
      const response = await apiRequest('/transactions/bulk/categories', {
        method: 'PATCH',
        body: JSON.stringify({ updates })
      });
      
      if (response.success) {
        return response.data;
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ bulkUpdateCategories error:', error);
      throw error;
    }
  },

  // Search transactions
  searchTransactions: async (searchTerm, filters = {}) => {
    try {
      const params = {
        search: searchTerm,
        q: searchTerm, // Some backends use 'q'
        ...filters
      };

      return await transactionsAPI.getTransactions(params);
    } catch (error) {
      console.error('❌ searchTransactions error:', error);
      throw error;
    }
  },

  // Get unlabeled transactions
  getUnlabeledTransactions: async (additionalFilters = {}) => {
    try {
      return await transactionsAPI.getTransactions({
        isLabeled: false,
        category: 'unlabeled',
        ...additionalFilters
      });
    } catch (error) {
      console.error('❌ getUnlabeledTransactions error:', error);
      throw error;
    }
  }
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await apiRequest('/categories');
      
      if (response.success && response.data) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      throw new Error(response.error || 'Failed to fetch categories');
    } catch (error) {
      console.error('❌ getCategories error:', error);
      throw error;
    }
  },

  // Create new category
  createCategory: async (categoryData) => {
    try {
      const payload = {
        name: categoryData.name?.trim(),
        budget: parseFloat(categoryData.budget) || 0,
        color: categoryData.color || '#3b82f6',
        description: categoryData.description || '',
        spent: 0 // Always start with 0 spent
      };

      const response = await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (response.success) {
        return response.data;
      } else if (response.category || response._id) {
        return response;
      }
      
      throw new Error(response.error || 'Failed to create category');
    } catch (error) {
      console.error('❌ createCategory error:', error);
      throw error;
    }
  },

  // Update category
  updateCategory: async (categoryId, updateData) => {
    try {
      const payload = {
        ...updateData,
        ...(updateData.budget && { budget: parseFloat(updateData.budget) }),
        updatedAt: new Date().toISOString()
      };

      const response = await apiRequest(`/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (response.success) {
        return response.data;
      } else if (response.category || response._id) {
        return response;
      }
      
      throw new Error(response.error || 'Failed to update category');
    } catch (error) {
      console.error('❌ updateCategory error:', error);
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    try {
      const response = await apiRequest(`/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.success || response.deleted) {
        return response;
      }
      
      throw new Error(response.error || 'Failed to delete category');
    } catch (error) {
      console.error('❌ deleteCategory error:', error);
      throw error;
    }
  }
};

// Utility functions for frontend use
export const apiUtils = {
  // Format amount for display
  formatAmount: (amount, currency = 'KSH') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency === 'KSH' ? 'KES' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  },

  // Format date for display
  formatDate: (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  },

  // Get transaction type info for display
  getTransactionTypeInfo: (transaction) => {
    const isIncome = transaction.transactionType === 'credit' || transaction.type === 'income';
    
    return isIncome
      ? { type: 'income', color: 'green', icon: '↑', label: 'Income', class: 'text-green-600' }
      : { type: 'expense', color: 'red', icon: '↓', label: 'Expense', class: 'text-red-600' };
  },

  // Validate transaction data before submission
  validateTransaction: (transactionData) => {
    const errors = {};

    if (!transactionData.amount || isNaN(parseFloat(transactionData.amount)) || parseFloat(transactionData.amount) <= 0) {
      errors.amount = 'Valid amount greater than 0 is required';
    }

    if (!transactionData.description || !transactionData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!transactionData.transactionType && !transactionData.type) {
      errors.type = 'Transaction type is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Get transaction date (handles both date fields)
  getTransactionDate: (transaction) => {
    return transaction.transactionDate || transaction.date || transaction.createdAt;
  },

  // Get transaction ID (handles both id fields)
  getTransactionId: (transaction) => {
    return transaction.id || transaction._id;
  }
};

// Default export with all APIs
export default {
  transactions: transactionsAPI,
  categories: categoriesAPI,
  utils: apiUtils
};