import { useState, useCallback } from 'react';
import { transactionsAPI } from '../services/api';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await transactionsAPI.getTransactions(params);
      setTransactions(data.transactions || []);
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to fetch transactions');
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove the dependency array to prevent infinite loop

  const updateTransactionCategory = useCallback(async (transactionId, category) => {
    try {
      await transactionsAPI.updateCategory(transactionId, category);
      setTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction._id === transactionId 
            ? { ...transaction, category, isLabeled: !!category }
            : transaction
        )
      );
    } catch (err) {
      setError(err?.message || 'Failed to update transaction');
      throw err;
    }
  }, []);

  // Remove automatic fetching - transactions will be added manually
  // useEffect(() => {
  //   fetchTransactions();
  // }, []);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    updateTransactionCategory,
    refetch: fetchTransactions
  };
};