// transactionsAPI.js
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    throw new Error(error.response.data?.error || error.response.data?.message || 'Server error');
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('Network error - please check your connection');
  } else {
    // Something else happened
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Helper function to get auth headers - FIXED TOKEN KEY
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken'); // Changed from 'token' to 'authToken'
  console.log('🔍 Getting auth headers, token exists:', !!token);
  if (token) {
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to make API requests
const apiRequest = async (url, options = {}) => {
  try {
    console.log(`🔄 API Request: ${options.method || 'GET'} ${API_BASE_URL}${url}`);
    
    const headers = {
      ...getAuthHeaders(),
      ...options.headers
    };
    
    console.log('📤 Request headers:', headers);
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers
    });

    console.log(`📥 Response status: ${response.status}`);
    
    const data = await response.json();
    console.log('📥 Response data:', data);

    if (!response.ok) {
      console.error('❌ API Error:', data);
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('❌ API Request failed:', error);
    handleApiError(error);
  }
};

export const transactionsAPI = {
  // CREATE - Add new transaction
  createTransaction: async (transactionData) => {
    const payload = {
      amount: parseFloat(transactionData.amount),
      description: transactionData.description?.trim(),
      transactionType: transactionData.transactionType || (transactionData.type === 'income' ? 'credit' : 'debit'),
      transactionDate: transactionData.transactionDate || transactionData.date,
      category: transactionData.category || null,
      mpesaReceiptNumber: transactionData.mpesaReceiptNumber,
      senderName: transactionData.senderName,
      senderPhone: transactionData.senderPhone,
      notes: transactionData.notes,
      tags: transactionData.tags || []
    };

    return await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // READ - Get all transactions with filtering and pagination
  getTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add all valid parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `/transactions${queryString ? `?${queryString}` : ''}`;
    
    const result = await apiRequest(url, { method: 'GET' });
    
    // Handle the response structure from your backend
    if (result.success && result.data) {
      return result.data; // This should contain { transactions: [...], pagination: {...} }
    }
    
    throw new Error(result.error || 'Failed to fetch transactions');
  },

  // READ - Get single transaction
  getTransaction: async (transactionId) => {
    const result = await apiRequest(`/transactions/${transactionId}`, {
      method: 'GET'
    });
    
    if (result.success) {
      return result.data;
    }
    
    throw new Error(result.error || 'Failed to fetch transaction');
  },

  // READ - Get transaction statistics
  getTransactionStats: async (period = '30d') => {
    const result = await apiRequest(`/transactions/stats?period=${period}`, {
      method: 'GET'
    });
    
    if (result.success) {
      return result.data;
    }
    
    throw new Error(result.error || 'Failed to fetch transaction stats');
  },

  // UPDATE - Update entire transaction
  updateTransaction: async (transactionId, updateData) => {
    const payload = {
      ...updateData,
      ...(updateData.amount && { amount: parseFloat(updateData.amount) }),
      ...(updateData.description && { description: updateData.description.trim() })
    };

    const result = await apiRequest(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
    if (result.success) {
      return result.data;
    }
    
    throw new Error(result.error || 'Failed to update transaction');
  },

  // UPDATE - Update transaction category only
  updateCategory: async (transactionId, category) => {
    const result = await apiRequest(`/transactions/${transactionId}/category`, {
      method: 'PATCH',
      body: JSON.stringify({ category })
    });
    
    if (result.success) {
      return result.data;
    }
    
    throw new Error(result.error || 'Failed to update category');
  },

  // UPDATE - Bulk update categories
  bulkUpdateCategories: async (updates) => {
    const result = await apiRequest('/transactions/bulk/categories', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    });
    
    if (result.success) {
      return result.data;
    }
    
    throw new Error(result.error || 'Failed to bulk update categories');
  },

  // DELETE - Delete transaction
  deleteTransaction: async (transactionId) => {
    const result = await apiRequest(`/transactions/${transactionId}`, {
      method: 'DELETE'
    });
    
    if (result.success) {
      return result;
    }
    
    throw new Error(result.error || 'Failed to delete transaction');
  },

  // SEARCH - Search transactions with text
  searchTransactions: async (searchTerm, filters = {}) => {
    const params = {
      search: searchTerm,
      ...filters
    };

    return await transactionsAPI.getTransactions(params);
  },

  // FILTER helpers
  getTransactionsByCategory: async (categoryId, additionalFilters = {}) => {
    return await transactionsAPI.getTransactions({
      category: categoryId,
      ...additionalFilters
    });
  },

  getTransactionsByType: async (type, additionalFilters = {}) => {
    return await transactionsAPI.getTransactions({
      type: type, // 'credit' or 'debit'
      ...additionalFilters
    });
  },

  getUnlabeledTransactions: async (additionalFilters = {}) => {
    return await transactionsAPI.getTransactions({
      category: 'unlabeled',
      ...additionalFilters
    });
  },

  // DATE RANGE helpers
  getTransactionsByDateRange: async (startDate, endDate, additionalFilters = {}) => {
    return await transactionsAPI.getTransactions({
      startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
      endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
      ...additionalFilters
    });
  },

  // EXPORT helper (if you want to export data)
  exportTransactions: async (format = 'json', filters = {}) => {
    const params = {
      ...filters,
      export: format,
      limit: 10000 // Large limit for export
    };

    return await transactionsAPI.getTransactions(params);
  }
};

// Additional utility functions for frontend
export const transactionUtils = {
  // Format amount for display
  formatAmount: (amount, currency = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
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

  // Get transaction type display info
  getTransactionTypeInfo: (transactionType) => {
    return transactionType === 'credit' 
      ? { type: 'income', color: 'green', icon: '↑', label: 'Income' }
      : { type: 'expense', color: 'red', icon: '↓', label: 'Expense' };
  },

  // Calculate transaction statistics
  calculateStats: (transactions) => {
    const stats = transactions.reduce((acc, transaction) => {
      const amount = transaction.amount || 0;
      
      acc.total += 1;
      
      if (transaction.transactionType === 'credit') {
        acc.totalIncome += amount;
        acc.incomeCount += 1;
      } else {
        acc.totalExpenses += amount;
        acc.expenseCount += 1;
      }
      
      if (!transaction.isLabeled) {
        acc.unlabeledCount += 1;
      }
      
      return acc;
    }, {
      total: 0,
      totalIncome: 0,
      totalExpenses: 0,
      incomeCount: 0,
      expenseCount: 0,
      unlabeledCount: 0
    });

    return {
      ...stats,
      netIncome: stats.totalIncome - stats.totalExpenses,
      averageIncome: stats.incomeCount > 0 ? stats.totalIncome / stats.incomeCount : 0,
      averageExpense: stats.expenseCount > 0 ? stats.totalExpenses / stats.expenseCount : 0,
      labeledPercentage: stats.total > 0 ? ((stats.total - stats.unlabeledCount) / stats.total * 100) : 0
    };
  },

  // Group transactions by date
  groupByDate: (transactions) => {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.transactionDate || transaction.createdAt).toDateString();
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(transaction);
      return groups;
    }, {});
  },

  // Group transactions by category
  groupByCategory: (transactions) => {
    return transactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Unlabeled';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      
      groups[category].push(transaction);
      return groups;
    }, {});
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
      errors.transactionType = 'Transaction type is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default transactionsAPI;
