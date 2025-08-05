import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  Edit3
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

const TransactionsPage = () => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Categories state - fetched from backend API
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(null);
  
  // UI State management
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewType, setViewType] = useState('all'); // 'all', 'income', 'expense'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form state
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  // Get auth token with better error handling
 const getAuthToken = useCallback(() => {
  try {
    let token = localStorage.getItem('authToken');
    
    if (!token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          token = user?.token || null;
        } catch (parseError) {
          console.warn('Failed to parse user data from localStorage:', parseError.message);
          localStorage.removeItem('user');
          // Attempt to reinitialize or fetch a new token if possible
          // (This depends on your authentication logic; adjust accordingly)
        }
      }
    }
    
    if (!token) {
      console.warn('No authentication token found');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error.message);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    return null;
  }
}, []);

  // Enhanced API call helper with better error handling
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      console.log(`🔄 API Call: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
      
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

      console.log(`📡 Response status: ${response.status} for ${endpoint}`);

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Received non-JSON response:', textResponse.substring(0, 200));
        throw new Error(`Server returned ${contentType} instead of JSON. Check if your backend is running correctly.`);
      }

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError.message);
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

      const data = await response.json();
      console.log(`✅ API Response received for ${endpoint}`);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and server status.');
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check if your backend server is running on http://localhost:8000');
      }
      
      throw error;
    }
  }, [getAuthToken]);

  // Fetch transactions from backend with better error handling
  const fetchTransactions = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching transactions...');
      const response = await apiCall('/transactions');
      
      // Handle different possible response formats
      let data;
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      } else if (response.transactions && Array.isArray(response.transactions)) {
        data = response.transactions;
      } else {
        console.error('❌ Unexpected response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Validate and normalize transaction data
      const validatedTransactions = data.map(transaction => ({
        _id: transaction._id || transaction.id,
        id: transaction._id || transaction.id,
        amount: Number(transaction.amount) || 0,
        description: transaction.description || 'No description',
        transactionType: transaction.transactionType || (transaction.type === 'income' ? 'credit' : 'debit'),
        type: transaction.type || (transaction.transactionType === 'credit' ? 'income' : 'expense'),
        transactionDate: transaction.transactionDate || transaction.date || new Date().toISOString(),
        date: transaction.date || transaction.transactionDate || new Date().toISOString(),
        mpesaReceiptNumber: transaction.mpesaReceiptNumber || `MANUAL_${Date.now()}`,
        senderName: transaction.senderName || '',
        category: transaction.category || null,
        isLabeled: Boolean(transaction.isLabeled),
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }));
      
      setTransactions(validatedTransactions);
      console.log(`✅ Successfully loaded ${validatedTransactions.length} transactions`);
      
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && (
        error.message.includes('Network error') || 
        error.message.includes('timed out') ||
        error.message.includes('Server returned')
      )) {
        console.log(`🔄 Retrying... (attempt ${retryCount + 2})`);
        setTimeout(() => fetchTransactions(retryCount + 1), 2000 * (retryCount + 1));
        return;
      }
      
      setError(error.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch categories from backend API with better error handling
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setCategoryError(null);
      
      console.log('🔄 Fetching categories for transactions...');
      const response = await apiCall('/categories');
      
      // Handle different possible response formats
      let data;
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response;
      } else if (response.categories && Array.isArray(response.categories)) {
        data = response.categories;
      } else {
        console.error('❌ Unexpected categories response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Map backend data to ensure consistency
      const validatedCategories = data.map(category => ({
        _id: category._id || category.id,
        id: category._id || category.id,
        name: category.name || 'Unnamed Category',
        color: category.color || '#3B82F6',
        budget: Number(category.budget) || 0,
        spent: Number(category.spent) || 0,
        description: category.description || '',
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }));
      
      setCategories(validatedCategories);
      console.log(`✅ Successfully loaded ${validatedCategories.length} categories for transactions`);
      
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategoryError(error.message);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [apiCall]);

  // Add new transaction to backend
  const addTransaction = useCallback(async (transactionData) => {
    try {
      console.log('📝 Creating transaction:', transactionData);
      const response = await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      // Handle different possible response formats
      let savedTransaction;
      if (response.data) {
        savedTransaction = response.data;
      } else if (response.transaction) {
        savedTransaction = response.transaction;
      } else {
        savedTransaction = response;
      }

      // Normalize the saved transaction
      const validatedTransaction = {
        _id: savedTransaction._id || savedTransaction.id,
        id: savedTransaction._id || savedTransaction.id,
        amount: Number(savedTransaction.amount) || 0,
        description: savedTransaction.description || 'No description',
        transactionType: savedTransaction.transactionType || (savedTransaction.type === 'income' ? 'credit' : 'debit'),
        type: savedTransaction.type || (savedTransaction.transactionType === 'credit' ? 'income' : 'expense'),
        transactionDate: savedTransaction.transactionDate || savedTransaction.date || new Date().toISOString(),
        date: savedTransaction.date || savedTransaction.transactionDate || new Date().toISOString(),
        mpesaReceiptNumber: savedTransaction.mpesaReceiptNumber || `MANUAL_${Date.now()}`,
        senderName: savedTransaction.senderName || '',
        category: savedTransaction.category || null,
        isLabeled: Boolean(savedTransaction.isLabeled),
        createdAt: savedTransaction.createdAt,
        updatedAt: savedTransaction.updatedAt
      };

      // Add to local state (add to beginning for newest first)
      setTransactions(prev => [validatedTransaction, ...prev]);
      console.log('✅ Transaction created successfully');
      return validatedTransaction;
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      throw error;
    }
  }, [apiCall]);

  // Update transaction in backend
  const updateTransaction = useCallback(async (transactionId, updates) => {
    if (!transactionId || !updates) return;
    
    try {
      console.log('📝 Updating transaction:', transactionId, updates);
      const response = await apiCall(`/transactions/${transactionId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      // Handle different possible response formats
      let updatedTransaction;
      if (response.data) {
        updatedTransaction = response.data;
      } else if (response.transaction) {
        updatedTransaction = response.transaction;
      } else {
        updatedTransaction = response;
      }

      // Update local state
      setTransactions(prev => 
        prev.map(transaction => 
          (transaction._id === transactionId || transaction.id === transactionId) 
            ? { ...transaction, ...updatedTransaction, _id: transaction._id || transaction.id }
            : transaction
        )
      );
      console.log('✅ Transaction updated successfully');
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      throw error;
    }
  }, [apiCall]);

  // Delete transaction from backend
  const deleteTransaction = useCallback(async (transactionId) => {
    if (!transactionId) return;
    
    try {
      console.log('🗑️ Deleting transaction:', transactionId);
      await apiCall(`/transactions/${transactionId}`, {
        method: 'DELETE'
      });

      // Remove from local state
      setTransactions(prev => prev.filter(transaction => 
        transaction._id !== transactionId && transaction.id !== transactionId
      ));
      console.log('✅ Transaction deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      throw error;
    }
  }, [apiCall]);

  // Load data on component mount
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  // Calculate statistics
  const stats = {
    total: transactions.length,
    income: transactions.filter(t => t.transactionType === 'credit' || t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0),
    expenses: transactions.filter(t => t.transactionType === 'debit' || t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0),
    unlabeled: transactions.filter(t => !t.isLabeled).length
  };
  stats.balance = stats.income - stats.expenses;

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesCategory = !selectedCategory || 
                            (selectedCategory === 'unlabeled' ? !transaction.isLabeled : transaction.category === selectedCategory);
      
      const transactionType = transaction.transactionType === 'credit' ? 'income' : 'expense';
      const matchesType = viewType === 'all' || transactionType === viewType;
      
      return matchesCategory && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        default:
          aValue = new Date(a.transactionDate || a.date).getTime();
          bValue = new Date(b.transactionDate || b.date).getTime();
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

  // Handle form submission
  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description || submitting) return;

    try {
      setSubmitting(true);
      await addTransaction({
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description.trim(),
        transactionType: newTransaction.type === 'income' ? 'credit' : 'debit',
        type: newTransaction.type,
        transactionDate: newTransaction.date ? new Date(newTransaction.date).toISOString() : new Date().toISOString(),
        mpesaReceiptNumber: `MANUAL_${Date.now()}`,
        isLabeled: false
      });

      setNewTransaction({ 
        amount: '', 
        description: '', 
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle category assignment/editing
  const handleCategoryChange = async (transactionId, categoryId) => {
    try {
      await updateTransaction(transactionId, { 
        category: categoryId,
        isLabeled: !!categoryId
      });
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
      setError(error.message);
    }
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        setError(error.message);
      }
    }
  };

  // Get category by ID (handles both _id and id)
  const getCategoryById = (id) => {
    return categories.find(cat => cat._id === id || cat.id === id);
  };

  // Get transaction type for display
  const getTransactionType = (transaction) => {
    return transaction.transactionType === 'credit' ? 'income' : 'expense';
  };

  // Get transaction date
  const getTransactionDate = (transaction) => {
    return transaction.transactionDate || transaction.date;
  };

  if (loading || loadingCategories) {
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-lg shadow-lg border border-gray-200">
          <Loader className="h-16 w-16 animate-spin mx-auto mb-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading transactions
          </h2>
          <p className="text-gray-600 text-lg font-medium">
            {loading ? 'Preparing your transaction data...' : 'Loading categories...'}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm font-medium">
                Please ensure your backend server is running on http://localhost:8000
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Transactions
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Keep track of your financial activity
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-green-100 p-6 rounded-lg text-gray-800 shadow-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-6 w-6" />
                <h3 className="text-lg font-bold">Total Income</h3>
              </div>
              <p className="text-2xl font-bold">KSH {stats.income.toLocaleString()}</p>
            </div>
            
            <div className="bg-red-100 p-6 rounded-lg text-gray-800 shadow-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingDown className="h-6 w-6" />
                <h3 className="text-lg font-bold">Total Expenses</h3>
              </div>
              <p className="text-2xl font-bold">KSH {stats.expenses.toLocaleString()}</p>
            </div>
            
            <div className={`bg-${stats.balance >= 0 ? 'blue-100' : 'orange-100'} p-6 rounded-lg text-gray-800 shadow-lg`}>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h3 className="text-lg font-bold">Balance</h3>
              </div>
              <p className="text-2xl font-bold">KSH {stats.balance.toLocaleString()}</p>
            </div>
            
            <div className="bg-yellow-100 p-6 rounded-lg text-gray-800 shadow-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertCircle className="h-6 w-6" />
                <h3 className="text-lg font-bold">Unlabeled</h3>
              </div>
              <p className="text-2xl font-bold">{stats.unlabeled}</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {(error || categoryError) && (
          <div className="mb-8 bg-red-50 border border-red-200 p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-bold text-red-800 mb-1">
                    Error
                  </h3>
                  <p className="text-red-700 font-medium">
                    {error || categoryError}
                  </p>
                  {(error || categoryError).includes('Server returned') && (
                    <p className="text-red-600 text-sm mt-2">
                      Please check your backend server
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => {
                  setError(null);
                  setCategoryError(null);
                }}
                className="bg-red-100 hover:bg-red-200 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            
            {/* Transaction Type Buttons */}
            <div className="flex items-center bg-gray-100 rounded-lg p-2 border border-gray-200">
              <button
                onClick={() => setViewType('all')}
                className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 flex items-center space-x-2 ${
                  viewType === 'all' 
                    ? 'bg-white text-gray-800 shadow-lg' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>All Transactions</span>
              </button>
              <button
                onClick={() => setViewType('income')}
                className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 flex items-center space-x-2 ${
                  viewType === 'income' 
                    ? 'bg-green-100 text-green-800 shadow-lg' 
                    : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span>Income</span>
              </button>
              <button
                onClick={() => setViewType('expense')}
                className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 flex items-center space-x-2 ${
                  viewType === 'expense' 
                    ? 'bg-red-100 text-red-800 shadow-lg' 
                    : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                }`}
              >
                <TrendingDown className="h-5 w-5" />
                <span>Expenses</span>
              </button>
            </div>

            {/* Add Transaction Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center space-x-3 shadow-lg font-bold text-lg"
            >
              <Plus className="h-6 w-6" />
              <span>Add Transaction</span>
            </button>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-6 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors bg-gray-50 font-medium text-lg"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
              <option value="unlabeled">Unlabeled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-6 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors bg-gray-50 font-medium text-lg"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="description">Sort by Description</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center space-x-3 px-6 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-300 font-bold text-lg bg-white"
            >
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </span>
            </button>
          </div>
        </div>

        {/* Add Transaction Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Add Transaction</h2>
                <button
                  onClick={() => !submitting && setShowAddForm(false)}
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors border border-gray-200"
                  disabled={submitting}
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-3">
                      Transaction Type
                    </label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors text-lg font-medium bg-gray-50"
                      disabled={submitting}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-3">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors text-lg font-medium bg-gray-50"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-3">
                    Amount (KSH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-6 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors text-2xl font-bold bg-gray-50 text-gray-800"
                    placeholder="0.00"
                    disabled={submitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-3">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-6 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors text-lg font-medium bg-gray-50"
                    placeholder="Enter transaction description"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={handleAddTransaction}
                    disabled={submitting || !newTransaction.amount || !newTransaction.description}
                    className="flex-1 bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center font-bold text-lg shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader className="h-6 w-6 animate-spin mr-3" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6 mr-3" />
                        <span>Add Transaction</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => !submitting && setShowAddForm(false)}
                    disabled={submitting}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg border border-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-8 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-4 rounded-full">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-lg text-gray-600 font-medium">
                    {stats.unlabeled > 0 && `${stats.unlabeled} need labels • `}
                    {categories.length} categories available
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                const category = transaction.category ? getCategoryById(transaction.category) : null;
                const transactionType = getTransactionType(transaction);
                const transactionId = transaction.id || transaction._id;
                const isEditingThisCategory = editingCategory === transactionId;
                
                return (
                  <div key={transactionId} className="p-8 hover:bg-gray-50 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 flex-1">
                        <div className={`p-4 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                          transactionType === 'expense' 
                            ? 'bg-red-100' 
                            : 'bg-green-100'
                        }`}>
                          {transactionType === 'expense' ? (
                            <ArrowDown className="h-8 w-8 text-red-600" />
                          ) : (
                            <ArrowUp className="h-8 w-8 text-green-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-2xl mb-2">
                            {transaction.description || 'No description'}
                          </h4>
                          <div className="flex items-center flex-wrap gap-4">
                            <div className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                              <span className="text-sm font-bold text-gray-700">
                                {new Date(getTransactionDate(transaction)).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {transaction.mpesaReceiptNumber && (
                              <div className="bg-blue-100 px-4 py-2 rounded-full border border-blue-200">
                                <span className="text-xs font-bold text-blue-700">
                                  {transaction.mpesaReceiptNumber}
                                </span>
                              </div>
                            )}
                            
                            {/* Category Display */}
                            {transaction.isLabeled && category && !isEditingThisCategory ? (
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="inline-flex items-center px-6 py-3 rounded-lg text-gray-800 font-bold text-lg shadow-lg border border-gray-200"
                                  style={{ backgroundColor: category.color }}
                                >
                                  <Tag className="h-5 w-5 mr-2" />
                                  {category.name}
                                </div>
                                <button
                                  onClick={() => setEditingCategory(transactionId)}
                                  className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-300 border border-gray-200"
                                  title="Edit category"
                                >
                                  <Edit3 className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <select
                                  value={transaction.category || ''}
                                  onChange={(e) => handleCategoryChange(transactionId, e.target.value)}
                                  className="px-6 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 font-bold text-lg shadow-lg"
                                  disabled={categories.length === 0}
                                >
                                  <option value="">
                                    {categories.length === 0 ? 'No categories available' : 
                                     transaction.isLabeled ? 'Change category' : 'Add category'}
                                  </option>
                                  {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                                {isEditingThisCategory && (
                                  <button
                                    onClick={() => setEditingCategory(null)}
                                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-all duration-300 border border-red-200"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Status Indicator */}
                            {transaction.isLabeled ? (
                              <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full border border-green-200">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-bold text-green-700">Labeled</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 bg-yellow-100 px-4 py-2 rounded-full border border-yellow-200">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                <span className="text-sm font-bold text-yellow-700">Needs Label</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <span className={`text-3xl font-bold px-6 py-3 rounded-lg shadow-lg ${
                          transactionType === 'expense' 
                            ? 'text-red-800 bg-red-100' 
                            : 'text-green-800 bg-green-100'
                        }`}>
                          {transactionType === 'expense' ? '-' : '+'}KSH {(transaction.amount || 0).toLocaleString()}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteTransaction(transactionId)}
                          className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 border border-gray-200 group-hover:scale-110"
                        >
                          <Trash2 className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">No transactions found</h3>
                <p className="text-lg text-gray-600 font-medium mb-8">
                  {selectedCategory || viewType !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first transaction to begin'
                  }
                </p>
                {!selectedCategory && viewType === 'all' && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-12 py-6 rounded-lg hover:bg-blue-700 transition-all duration-300 inline-flex items-center space-x-4 shadow-lg font-bold text-lg"
                  >
                    <Plus className="h-8 w-8" />
                    <span>Add Transaction</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;