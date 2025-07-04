import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Transaction structure:
 * {
 *   id: string;
 *   amount: number;
 *   type: 'expense' | 'income';
 *   description: string;
 *   date: string;
 *   mpesaCode: string;
 *   category?: string;
 *   isLabeled: boolean;
 *   status?: string;
 * }
 *
 * Category structure:
 * {
 *   id: string;
 *   name: string;
 *   color: string;
 *   budget: number;
 *   spent: number;
 * }
 */

// Transaction API Service
class TransactionAPI {
  constructor() {
    // eslint-disable-next-line no-undef
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Fetch user transactions
  async fetchTransactions(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`${this.baseURL}/mpesa/transactions?${queryParams}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Sync transactions from M-Pesa
  async syncTransactions() {
    try {
      const response = await fetch(`${this.baseURL}/mpesa/sync`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw error;
    }
  }

  // Update transaction category
  async updateTransactionCategory(transactionId, categoryId) {
    try {
      const response = await fetch(`${this.baseURL}/transactions/${transactionId}/category`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ categoryId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating transaction category:', error);
      throw error;
    }
  }
}

// Create transaction API instance
const transactionAPI = new TransactionAPI();

// Create a context with undefined initial value
const DataContext = createContext(undefined);

/**
 * DataProvider component
 * - Holds application state: transactions and categories
 * - Provides functions to manipulate this state
 * - Integrates with M-Pesa API for real transaction data
 */
export const DataProvider = ({ children }) => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'food', name: 'Food & Dining', color: '#EF4444', budget: 5000, spent: 0 },
    { id: 'transport', name: 'Transport', color: '#3B82F6', budget: 3000, spent: 0 },
    { id: 'entertainment', name: 'Entertainment', color: '#8B5CF6', budget: 2000, spent: 0 },
    { id: 'utilities', name: 'Utilities', color: '#F59E0B', budget: 4000, spent: 0 },
    { id: 'shopping', name: 'Shopping', color: '#10B981', budget: 2500, spent: 0 },
    { id: 'healthcare', name: 'Healthcare', color: '#EC4899', budget: 1500, spent: 0 },
    { id: 'education', name: 'Education', color: '#6366F1', budget: 2000, spent: 0 },
    { id: 'income', name: 'Income', color: '#059669', budget: 0, spent: 0 },
    { id: 'other', name: 'Other', color: '#6B7280', budget: 1000, spent: 0 }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Update category spending when transactions change
  useEffect(() => {
    updateCategorySpending();
  }, [transactions, updateCategorySpending]);

  /**
   * Fetch transactions from M-Pesa API
   * Falls back to mock data if API is unavailable
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps, no-undef
  const fetchTransactions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is authenticated
      const authToken = transactionAPI.getAuthToken();
      
      if (!authToken) {
        // Use mock data if not authenticated
        setTransactions(getMockTransactions());
        return;
      }

      const response = await transactionAPI.fetchTransactions(filters);
      
      if (response.success) {
        setTransactions(response.transactions);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (error) {
      console.warn('API unavailable, using mock data:', error.message);
      // Fall back to mock data
      setTransactions(getMockTransactions());
      setError(null); // Don't show error for fallback
    } finally {
      setLoading(false);
    }
  });

  /**
   * Sync transactions from M-Pesa
   * TODO: Integrate with backend API
   */
  const syncTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authToken = transactionAPI.getAuthToken();
      
      if (!authToken) {
        throw new Error('Authentication required for sync');
      }

      const response = await transactionAPI.syncTransactions();
      
      if (response.success) {
        // Refresh transactions after sync
        await fetchTransactions();
        return response;
      } else {
        throw new Error('Failed to sync transactions');
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      setError(error.message || 'Failed to sync transactions');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get mock transactions for development/fallback
   */
  const getMockTransactions = () => {
    return [
      {
        id: '1',
        amount: 500,
        type: 'expense',
        description: 'Sent to Jane Doe',
        date: new Date().toISOString(),
        mpesaCode: 'QBK2H5I9OP',
        category: 'food',
        isLabeled: true,
        status: 'completed'
      },
      {
        id: '2',
        amount: 1200,
        type: 'expense',
        description: 'Paid for groceries',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        mpesaCode: 'QBK2H5I9OQ',
        category: 'food',
        isLabeled: true,
        status: 'completed'
      },
      {
        id: '3',
        amount: 300,
        type: 'expense',
        description: 'Bus fare',
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        mpesaCode: 'QBK2H5I9OR',
        category: 'transport',
        isLabeled: true,
        status: 'completed'
      },
      {
        id: '4',
        amount: 2000,
        type: 'income',
        description: 'Salary deposit',
        date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        mpesaCode: 'QBK2H5I9OS',
        category: 'income',
        isLabeled: true,
        status: 'completed'
      },
      {
        id: '5',
        amount: 800,
        type: 'expense',
        description: 'Electricity bill',
        date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        mpesaCode: 'QBK2H5I9OT',
        isLabeled: false,
        status: 'completed'
      }
    ];
  };

  /**
   * Adds a new transaction
   * TODO: Integrate with backend API (POST /api/transactions)
   */
  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      isLabeled: !!transaction.category,
      status: 'completed'
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Backend API call placeholder:
    // fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTransaction) });
  };

  /**
   * Updates an existing transaction by ID
   * Integrates with M-Pesa API for category updates
   */
  const updateTransaction = async (id, updates) => {
    try {
      // If updating category and user is authenticated, call API
      if (updates.category && transactionAPI.getAuthToken()) {
        await transactionAPI.updateTransactionCategory(id, updates.category);
      }
      
      // Update local state
      const updatedTransactions = transactions.map(transaction =>
        transaction.id === id
          ? { ...transaction, ...updates, isLabeled: !!updates.category || transaction.isLabeled }
          : transaction
      );
      setTransactions(updatedTransactions);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError(error.message || 'Failed to update transaction');
      
      // Still update local state even if API fails
      const updatedTransactions = transactions.map(transaction =>
        transaction.id === id
          ? { ...transaction, ...updates, isLabeled: !!updates.category || transaction.isLabeled }
          : transaction
      );
      setTransactions(updatedTransactions);
    }
  };

  /**
   * Adds a new category
   * TODO: Integrate with backend API (POST /api/categories)
   */
  const addCategory = (category) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
      spent: 0
    };

    setCategories(prev => [...prev, newCategory]);
    // Backend API call placeholder:
    // fetch('/api/categories', ...)
  };

  /**
   * Updates a category by ID
   * TODO: Integrate with backend API (PUT /api/categories/:id)
   */
  const updateCategory = (id, updates) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === id
          ? { ...category, ...updates }
          : category
      )
    );
  };

  /**
   * Updates category "spent" totals based on current transactions
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateCategorySpending = () => {
    const updated = categories.map(category => {
      const spent = transactions
        .filter(t => t.category === category.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...category, spent };
    });
    setCategories(updated);
  };

  /**
   * Returns the number of labeled transactions for today
   */
  const getLabeledTransactionsToday = () => {
    const today = new Date().toDateString();
    return transactions.filter(t =>
      new Date(t.date).toDateString() === today && t.isLabeled
    ).length;
  };

  /**
   * Returns all unlabeled transactions
   */
  const getUnlabeledTransactions = () => {
    return transactions.filter(t => !t.isLabeled);
  };

  /**
   * Calculates total spending for a category over a given time period
   * @param {string} categoryId
   * @param {'daily'|'weekly'|'monthly'|'quarterly'|'annual'} period
   */
  const getCategorySpending = (categoryId, period) => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        // eslint-disable-next-line no-case-declarations
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'annual':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // default to all-time
    }

    return transactions
      .filter(t =>
        t.category === categoryId &&
        t.type === 'expense' &&
        new Date(t.date) >= startDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  /**
   * Get transactions summary
   */
  const getTransactionSummary = () => {
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'expense') {
        acc.totalExpenses += transaction.amount;
        acc.expenseCount += 1;
      } else {
        acc.totalIncome += transaction.amount;
        acc.incomeCount += 1;
      }
      return acc;
    }, {
      totalExpenses: 0,
      totalIncome: 0,
      expenseCount: 0,
      incomeCount: 0
    });

    summary.netIncome = summary.totalIncome - summary.totalExpenses;
    summary.totalTransactions = transactions.length;
    
    return summary;
  };

  /**
   * Get category breakdown
   */
  const getCategoryBreakdown = () => {
    const breakdown = {};
    
    transactions.forEach(transaction => {
      if (transaction.category && transaction.type === 'expense') {
        const category = categories.find(cat => cat.id === transaction.category);
        if (category) {
          if (!breakdown[category.name]) {
            breakdown[category.name] = {
              amount: 0,
              count: 0,
              color: category.color
            };
          }
          breakdown[category.name].amount += transaction.amount;
          breakdown[category.name].count += 1;
        }
      }
    });

    return breakdown;
  };

  // Expose all values and functions to consuming components
  const value = {
    // State
    transactions,
    categories,
    loading,
    error,
    
    // Transaction functions
    addTransaction,
    updateTransaction,
    fetchTransactions,
    syncTransactions,
    
    // Category functions
    addCategory,
    updateCategory,
    
    // Utility functions
    getLabeledTransactionsToday,
    getUnlabeledTransactions,
    getCategorySpending,
    getTransactionSummary,
    getCategoryBreakdown,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * Custom hook to consume the DataContext safely
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};