import React, { createContext, useState, useEffect, useCallback } from 'react';
import TransactionAPI from '../services/transactionService';

export const DataContext = createContext(undefined);

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);

  const getMockTransactions = useCallback(() => [
    {
      id: '1',
      amount: 500,
      type: 'expense',
      description: 'Sent to Jane Doe',
      date: new Date().toISOString(),
      mpesaCode: 'CODE1',
      category: 'food',
      isLabeled: true,
      status: 'completed'
    }
  ], []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
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
        throw new Error('Failed to fetch');
      }
    } catch (err) {
      console.warn('API unavailable, using mock:', err.message);
      setTransactions(getMockTransactions());
    } finally {
      setLoading(false);
    }
  }, [getMockTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
    getLabeledTransactionsToday,
    getUnlabeledTransactions
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
