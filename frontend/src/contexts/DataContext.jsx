import React, { createContext, useState, useEffect, useCallback } from 'react';
import TransactionAPI from '../services/transactionService';

export const DataContext = createContext(undefined);

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getMockTransactions = useCallback(() => [], []);

  const getMockCategories = useCallback(() => [], []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = TransactionAPI.getAuthToken();
      if (!authToken) {
        setTransactions(getMockTransactions());
        return;
      }

      const response = await TransactionAPI.fetchTransactions();
      if (response.success) {
        setTransactions(response.transactions);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (err) {
      console.warn('API unavailable, using mock transactions:', err.message);
      setError(err.message);
      setTransactions(getMockTransactions());
    } finally {
      setLoading(false);
    }
  }, [getMockTransactions]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = TransactionAPI.getAuthToken();
      if (!authToken) {
        setCategories(getMockCategories());
        return;
      }

      const response = await fetch('http://localhost:8000/api/categories', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.warn('API unavailable, using mock categories:', err.message);
      setError(err.message);
      setCategories(getMockCategories());
    } finally {
      setLoading(false);
    }
  }, [getMockCategories]);

  const addTransaction = useCallback(async (transactionData) => {
    setLoading(true);
    setError(null);
    try {
      const authToken = TransactionAPI.getAuthToken();
      
      if (!authToken) {
        // Mock add transaction
        const newTransaction = {
          id: Date.now().toString(),
          ...transactionData,
          date: new Date().toISOString(),
          status: 'completed'
        };
        setTransactions(prev => [newTransaction, ...prev]);
        return { success: true, transaction: newTransaction };
      }

      const response = await TransactionAPI.addManualTransaction(transactionData);
      // The API returns the transaction directly, not wrapped in a success object
      setTransactions(prev => [response, ...prev]);
      return { success: true, transaction: response };
    } catch (err) {
      console.error('Error adding transaction:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTransaction = useCallback(async (transactionId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const authToken = TransactionAPI.getAuthToken();
      
      if (!authToken) {
        // Mock update transaction
        setTransactions(prev => 
          prev.map(t => t.id === transactionId ? { ...t, ...updates } : t)
        );
        return { success: true };
      }

      // Update the local state
      setTransactions(prev => 
        prev.map(t => t.id === transactionId ? { ...t, ...updates } : t)
      );
      return { success: true };
    } catch (err) {
      console.error('Error updating transaction:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (transactionId) => {
    setLoading(true);
    setError(null);
    try {
      const authToken = TransactionAPI.getAuthToken();
      
      if (!authToken) {
        // Mock delete transaction
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        return { success: true };
      }

      // Update the local state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting transaction:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  const getLabeledTransactionsToday = () => {
    const today = new Date().toDateString();
    return transactions.filter(t => new Date(t.date).toDateString() === today && t.isLabeled).length;
  };

  const getUnlabeledTransactions = () => {
    return transactions.filter(t => !t.isLabeled);
  };

  const value = {
    transactions,
    categories,
    loading,
    error,
    fetchTransactions,
    fetchCategories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getLabeledTransactionsToday,
    getUnlabeledTransactions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};