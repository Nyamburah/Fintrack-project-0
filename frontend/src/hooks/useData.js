// hooks/useData.js
import { useState, useCallback } from 'react';

export const useData = () => {
  // State management - using React state instead of localStorage
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([
    { id: '1', name: 'Food & Dining', budget: 15000, spent: 0, color: '#ef4444' },
    { id: '2', name: 'Transportation', budget: 8000, spent: 0, color: '#3b82f6' },
    { id: '3', name: 'Shopping', budget: 12000, spent: 0, color: '#8b5cf6' },
    { id: '4', name: 'Entertainment', budget: 5000, spent: 0, color: '#06b6d4' },
    { id: '5', name: 'Bills & Utilities', budget: 20000, spent: 0, color: '#f59e0b' },
    { id: '6', name: 'Healthcare', budget: 7000, spent: 0, color: '#10b981' },
    { id: '7', name: 'Education', budget: 10000, spent: 0, color: '#f97316' },
    { id: '8', name: 'Income', budget: 0, spent: 0, color: '#22c55e' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Validate transaction data
  const validateTransaction = (transactionData) => {
    const errors = {};
    
    if (!transactionData.description || transactionData.description.trim() === '') {
      errors.description = 'Description is required';
    }
    
    if (!transactionData.amount || transactionData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!transactionData.type || !['income', 'expense'].includes(transactionData.type)) {
      errors.type = 'Type must be either income or expense';
    }
    
    if (!transactionData.date && !transactionData.transactionDate) {
      errors.date = 'Date is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Add new transaction
  const addTransaction = useCallback(async (transactionData) => {
    try {
      setLoading(true);
      clearError();

      // Validate transaction data
      const validation = validateTransaction(transactionData);
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors).join(', '));
      }

      // Create new transaction with generated ID
      const newTransaction = {
        id: generateId(),
        _id: generateId(), // For compatibility
        ...transactionData,
        date: transactionData.date || transactionData.transactionDate || new Date().toISOString(),
        transactionDate: transactionData.transactionDate || transactionData.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isLabeled: !!transactionData.category,
        mpesaReceiptNumber: transactionData.mpesaReceiptNumber || `TXN${generateId().slice(-8).toUpperCase()}`,
        senderName: transactionData.senderName || 'Manual Entry',
        // Ensure transactionType is set correctly
        transactionType: transactionData.transactionType || (transactionData.type === 'income' ? 'credit' : 'debit')
      };

      // Add to transactions list (newest first)
      setTransactions(prev => [newTransaction, ...prev]);

      // Update category spent amount if category is provided
      if (transactionData.category && (transactionData.type === 'expense' || transactionData.transactionType === 'debit')) {
        setCategories(prev => 
          prev.map(cat => 
            cat.id === transactionData.category 
              ? { ...cat, spent: cat.spent + transactionData.amount }
              : cat
          )
        );
      }
      
      return newTransaction;
    } catch (err) {
      setError(err.message);
      console.error('Error adding transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Update transaction
  const updateTransaction = useCallback(async (transactionId, updateData) => {
    try {
      setLoading(true);
      clearError();

      setTransactions(prev => 
        prev.map(transaction => 
          (transaction.id === transactionId || transaction._id === transactionId)
            ? { ...transaction, ...updateData, updatedAt: new Date().toISOString() }
            : transaction
        )
      );
      
      const updatedTransaction = transactions.find(t => t.id === transactionId || t._id === transactionId);
      return { ...updatedTransaction, ...updateData };
    } catch (err) {
      setError(err.message);
      console.error('Error updating transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, transactions]);

  // Update transaction category
  const updateTransactionCategory = useCallback(async (transactionId, categoryId) => {
    try {
      const transaction = transactions.find(t => t.id === transactionId || t._id === transactionId);
      if (!transaction) throw new Error('Transaction not found');

      // Update category spent amounts
      if (transaction.category && (transaction.type === 'expense' || transaction.transactionType === 'debit')) {
        // Remove from old category
        setCategories(prev => 
          prev.map(cat => 
            cat.id === transaction.category 
              ? { ...cat, spent: Math.max(0, cat.spent - transaction.amount) }
              : cat
          )
        );
      }

      if (categoryId && (transaction.type === 'expense' || transaction.transactionType === 'debit')) {
        // Add to new category
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId 
              ? { ...cat, spent: cat.spent + transaction.amount }
              : cat
          )
        );
      }

      // Update transaction
      setTransactions(prev => 
        prev.map(t => 
          (t.id === transactionId || t._id === transactionId)
            ? { ...t, category: categoryId, isLabeled: !!categoryId }
            : t
        )
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error updating category:', err);
      throw err;
    }
  }, [transactions]);

  // Bulk update categories
  const bulkUpdateCategories = useCallback(async (updates) => {
    try {
      setLoading(true);
      clearError();

      updates.forEach(update => {
        const transaction = transactions.find(t => t.id === update.id || t._id === update.id);
        if (transaction && (transaction.type === 'expense' || transaction.transactionType === 'debit')) {
          // Update category spent amounts
          setCategories(prev => 
            prev.map(cat => 
              cat.id === update.category 
                ? { ...cat, spent: cat.spent + transaction.amount }
                : cat
            )
          );
        }
      });

      // Update transactions
      setTransactions(prev => 
        prev.map(transaction => {
          const update = updates.find(u => u.id === transaction.id || u.id === transaction._id);
          return update 
            ? { ...transaction, category: update.category, isLabeled: true }
            : transaction;
        })
      );
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error bulk updating categories:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, transactions]);

  // Delete transaction
  const deleteTransaction = useCallback(async (transactionId) => {
    try {
      setLoading(true);
      clearError();

      const transaction = transactions.find(t => t.id === transactionId || t._id === transactionId);
      if (transaction && transaction.category && (transaction.type === 'expense' || transaction.transactionType === 'debit')) {
        // Remove from category spent amount
        setCategories(prev => 
          prev.map(cat => 
            cat.id === transaction.category 
              ? { ...cat, spent: Math.max(0, cat.spent - transaction.amount) }
              : cat
          )
        );
      }

      setTransactions(prev => prev.filter(t => t.id !== transactionId && t._id !== transactionId));
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting transaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, transactions]);

  // Get unlabeled transactions
  const getUnlabeledTransactions = useCallback(() => {
    return transactions.filter(transaction => !transaction.category || !transaction.isLabeled);
  }, [transactions]);

  // Get labeled transactions for today
  const getLabeledTransactionsToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate || transaction.date);
      transactionDate.setHours(0, 0, 0, 0);
      
      return transactionDate.getTime() === today.getTime() && 
             transaction.category && 
             transaction.isLabeled;
    }).length;
  }, [transactions]);

  // Filter transactions by date range
  const getTransactionsByDateRange = useCallback((startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate || transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  }, [transactions]);

  // Filter transactions by category
  const getTransactionsByCategory = useCallback((categoryId) => {
    return transactions.filter(transaction => transaction.category === categoryId);
  }, [transactions]);

  // Filter transactions by type
  const getTransactionsByType = useCallback((type) => {
    return transactions.filter(transaction => 
      transaction.type === type || 
      (type === 'income' && transaction.transactionType === 'credit') ||
      (type === 'expense' && transaction.transactionType === 'debit')
    );
  }, [transactions]);

  // Search transactions
  const searchTransactions = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return transactions;
    
    const term = searchTerm.toLowerCase();
    return transactions.filter(transaction => 
      (transaction.description || '').toLowerCase().includes(term) ||
      (transaction.mpesaReceiptNumber || '').toLowerCase().includes(term) ||
      (transaction.senderName || '').toLowerCase().includes(term) ||
      transaction.amount.toString().includes(term)
    );
  }, [transactions]);

  // Add category
  const addCategory = useCallback((categoryData) => {
    try {
      const newCategory = {
        id: generateId(),
        ...categoryData,
        spent: 0,
        createdAt: new Date().toISOString()
      };
      
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update category
  const updateCategory = useCallback((categoryId, updateData) => {
    try {
      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, ...updateData, updatedAt: new Date().toISOString() }
            : cat
        )
      );
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback((categoryId) => {
    try {
      // Remove category from transactions
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.category === categoryId 
            ? { ...transaction, category: null, isLabeled: false }
            : transaction
        )
      );
      
      // Remove category
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Calculate stats
  const calculateStats = useCallback(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income' || t.transactionType === 'credit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense' || t.transactionType === 'debit')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalBudget = categories.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = categories.reduce((sum, c) => sum + (c.spent || 0), 0);
    
    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      totalBudget,
      totalSpent,
      budgetUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      transactionCount: transactions.length,
      labeledCount: transactions.filter(t => t.isLabeled).length,
      unlabeledCount: transactions.filter(t => !t.isLabeled).length
    };
  }, [transactions, categories]);

  // Group transactions by date
  const groupTransactionsByDate = useCallback(() => {
    const grouped = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate || transaction.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });
    
    return grouped;
  }, [transactions]);

  // Group transactions by category
  const groupTransactionsByCategory = useCallback(() => {
    const grouped = {};
    
    transactions.forEach(transaction => {
      const categoryId = transaction.category || 'uncategorized';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(transaction);
    });
    
    return grouped;
  }, [transactions]);

  // Clear all data
  const clearAllData = useCallback(() => {
    setTransactions([]);
    setCategories([
      { id: '1', name: 'Food & Dining', budget: 15000, spent: 0, color: '#ef4444' },
      { id: '2', name: 'Transportation', budget: 8000, spent: 0, color: '#3b82f6' },
      { id: '3', name: 'Shopping', budget: 12000, spent: 0, color: '#8b5cf6' },
      { id: '4', name: 'Entertainment', budget: 5000, spent: 0, color: '#06b6d4' },
      { id: '5', name: 'Bills & Utilities', budget: 20000, spent: 0, color: '#f59e0b' },
      { id: '6', name: 'Healthcare', budget: 7000, spent: 0, color: '#10b981' },
      { id: '7', name: 'Education', budget: 10000, spent: 0, color: '#f97316' },
      { id: '8', name: 'Income', budget: 0, spent: 0, color: '#22c55e' },
    ]);
  }, []);

  // Export data
  const exportData = useCallback(() => {
    return {
      transactions,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }, [transactions, categories]);

  // Import data
  const importData = useCallback((data) => {
    try {
      if (data.transactions) setTransactions(data.transactions);
      if (data.categories) setCategories(data.categories);
      return { success: true };
    } catch (err) {
      setError('Invalid data format');
      throw err;
    }
  }, []);

  // Return all the data and functions
  return {
    // Data
    transactions,
    categories,
    loading,
    error,
    stats: calculateStats(),

    // Transaction actions
    addTransaction,
    updateTransaction,
    updateTransactionCategory,
    bulkUpdateCategories,
    deleteTransaction,
    
    // Category actions
    addCategory,
    updateCategory,
    deleteCategory,
    
    // Search and filter
    searchTransactions,
    getTransactionsByCategory,
    getTransactionsByType,
    getUnlabeledTransactions,
    getLabeledTransactionsToday,
    getTransactionsByDateRange,

    // Utilities
    calculateStats,
    groupTransactionsByDate,
    groupTransactionsByCategory,
    clearError,
    clearAllData,
    exportData,
    importData
  };
};