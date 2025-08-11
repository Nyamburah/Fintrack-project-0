/* eslint-disable no-undef */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the context
const CategoriesContext = createContext();

// Custom hook to use the context
export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
};

// API utility function
const apiCall = async (endpoint, options = {}) => {
  try {
    const baseURL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 'http://localhost:5000/api';
    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Categories Provider Component
export const CategoriesProvider = ({ children }) => {
  // Core state
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update category spent amounts based on transactions
  const updateCategorySpentAmounts = useCallback((transactionsList) => {
    setCategories(prevCategories => {
      return prevCategories.map(category => {
        // Calculate spent amount for this category
        const categoryTransactions = transactionsList.filter(transaction => {
          // Handle different ways category might be referenced
          const transactionCategoryId = 
            transaction.category?._id || 
            transaction.category?.id || 
            transaction.category || 
            transaction.categoryId;
          
          const categoryId = category._id || category.id;
          
          return transactionCategoryId === categoryId && 
                 (transaction.type === 'expense' || transaction.transactionType === 'debit');
        });

        const spent = categoryTransactions.reduce((total, t) => total + (t.amount || 0), 0);
        
        return {
          ...category,
          spent
        };
      });
    });
  }, []);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📥 Loading categories...');
      
      const data = await apiCall('/categories');
      console.log('📊 Categories loaded:', data);
      
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      setError(error.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load transactions from API
  const loadTransactions = useCallback(async () => {
    try {
      console.log('📥 Loading transactions...');
      const data = await apiCall('/transactions');
      console.log('💰 Transactions loaded:', data);
      
      const transactionsList = Array.isArray(data) ? data : [];
      setTransactions(transactionsList);
      
      // Update category spent amounts based on transactions
      updateCategorySpentAmounts(transactionsList);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      setError(error.message || 'Failed to load transactions');
      setTransactions([]);
    }
  }, [updateCategorySpentAmounts]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    console.log('🔄 Refreshing all data...');
    try {
      setLoading(true);
      await Promise.all([loadCategories(), loadTransactions()]);
      console.log('✅ Data refresh complete');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadTransactions]);

  // Load initial data
  useEffect(() => {
    console.log('🚀 Initializing categories context...');
    loadCategories();
    loadTransactions();
  }, [loadCategories, loadTransactions]);

  // Add new category
  const addCategory = useCallback(async (categoryData) => {
    try {
      console.log('➕ Adding category:', categoryData);
      const savedCategory = await apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify({
          ...categoryData,
          spent: 0 // Initialize spent amount
        })
      });

      console.log('✅ Category added:', savedCategory);
      setCategories(prev => [savedCategory, ...prev]);
      return { success: true, data: savedCategory };
    } catch (error) {
      console.error('❌ Error adding category:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Add new transaction
  const addTransaction = useCallback(async (transactionData) => {
    try {
      console.log('➕ Adding transaction:', transactionData);
      
      // Ensure proper transaction structure
      const transactionPayload = {
        ...transactionData,
        type: transactionData.type || 'expense',
        transactionType: (transactionData.type === 'income') ? 'credit' : 'debit',
        transactionDate: transactionData.transactionDate || new Date().toISOString(),
        isLabeled: !!transactionData.category
      };

      const savedTransaction = await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionPayload)
      });

      console.log('✅ Transaction added:', savedTransaction);
      setTransactions(prev => [savedTransaction, ...prev]);
      
      // Update category spent amount if it's an expense
      if (savedTransaction.type === 'expense' || savedTransaction.transactionType === 'debit') {
        setCategories(prev => 
          prev.map(cat => {
            const categoryId = cat._id || cat.id;
            const transactionCategoryId = savedTransaction.category?._id || 
                                         savedTransaction.category?.id || 
                                         savedTransaction.category;
            
            if (categoryId === transactionCategoryId) {
              return {
                ...cat,
                spent: (cat.spent || 0) + savedTransaction.amount
              };
            }
            return cat;
          })
        );
      }

      return { success: true, data: savedTransaction };
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (id, updates) => {
    try {
      console.log('📝 Updating category:', id, updates);
      const updatedCategory = await apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      console.log('✅ Category updated:', updatedCategory);
      setCategories(prev => 
        prev.map(cat => {
          const categoryId = cat._id || cat.id;
          return categoryId === id ? { ...cat, ...updatedCategory } : cat;
        })
      );

      return { success: true, data: updatedCategory };
    } catch (error) {
      console.error('❌ Error updating category:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id) => {
    try {
      console.log('🗑️ Deleting category:', id);
      await apiCall(`/categories/${id}`, {
        method: 'DELETE'
      });

      console.log('✅ Category deleted');
      setCategories(prev => prev.filter(cat => {
        const categoryId = cat._id || cat.id;
        return categoryId !== id;
      }));
      
      // Remove transactions for this category
      setTransactions(prev => prev.filter(t => {
        const transactionCategoryId = t.category?._id || t.category?.id || t.category || t.categoryId;
        return transactionCategoryId !== id;
      }));

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Get transactions for a specific category
  const getCategoryTransactions = useCallback((categoryId) => {
    if (!categoryId || !transactions) return [];
    
    return transactions.filter(transaction => {
      // Handle different ways category might be referenced
      const transactionCategoryId = 
        transaction.category?._id || 
        transaction.category?.id || 
        transaction.category || 
        transaction.categoryId;
      
      return transactionCategoryId === categoryId;
    }).sort((a, b) => {
      // Sort by transaction date descending
      const dateA = new Date(a.transactionDate || a.date || a.createdAt || 0);
      const dateB = new Date(b.transactionDate || b.date || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [transactions]);

  // Get category statistics
  const getCategoryStats = useCallback((category) => {
    if (!category) {
      return {
        spent: 0,
        budget: 0,
        remaining: 0,
        usagePercentage: 0,
        isOverBudget: false
      };
    }

    const spent = category.spent || 0;
    const budget = category.budget || 0;
    const remaining = budget - spent;
    const usagePercentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = spent > budget && budget > 0;

    return {
      spent,
      budget,
      remaining,
      usagePercentage,
      isOverBudget
    };
  }, []);

  // Context value
  const contextValue = {
    // Data
    categories,
    transactions,
    loading,
    error,

    // Core CRUD operations
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    loadCategories,
    loadTransactions,
    refreshAll,

    // Data utilities
    getCategoryTransactions,
    getCategoryStats,

    // Utility functions
    clearError,
    updateCategorySpentAmounts
  };

  return (
    <CategoriesContext.Provider value={contextValue}>
      {children}
    </CategoriesContext.Provider>
  );
};

// Export context for direct use if needed
export { CategoriesContext };

export default CategoriesContext;