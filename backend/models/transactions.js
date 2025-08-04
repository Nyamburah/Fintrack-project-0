import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
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
  const [searchTerm, setSearchTerm] = useState('');
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

  // Get auth token (same as CategoriesPage)
  const getAuthToken = useCallback(() => {
    try {
      let token = localStorage.getItem('authToken');
      
      if (!token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          token = user?.token || null;
        }
      }
      
      if (!token) {
        console.warn('No authentication token found');
        window.location.href = '/login';
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return null;
    }
  }, []);

  // API call helper with timeout and error handling
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError.message);
          errorMessage = response.statusText || errorMessage;
        }

        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
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
  }, [getAuthToken]);

  // Fetch transactions from backend
  const fetchTransactions = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching transactions...');
      const data = await apiCall('/transactions');
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }
      
      // Validate and normalize transaction data
      const validatedTransactions = data.map(transaction => ({
        _id: transaction._id || transaction.id,
        id: transaction._id || transaction.id, // Keep both for compatibility
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
        error.message.includes('timed out')
      )) {
        console.log(`🔄 Retrying... (attempt ${retryCount + 2})`);
        setTimeout(() => fetchTransactions(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setError(error.message);
      // Set empty array on error so UI still works
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch categories from backend API
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setCategoryError(null);
      
      console.log('🔄 Fetching categories for transactions...');
      const data = await apiCall('/categories');
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }
      
      // Map backend data to ensure consistency
      const validatedCategories = data.map(category => ({
        _id: category._id || category.id,
        id: category._id || category.id, // Keep both for compatibility
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
      // Set empty array on error so UI still works
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [apiCall]);

  // Add new transaction to backend
  const addTransaction = useCallback(async (transactionData) => {
    try {
      console.log('📝 Creating transaction:', transactionData);
      const savedTransaction = await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

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
      const updatedTransaction = await apiCall(`/transactions/${transactionId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

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
      const description = transaction.description || '';
      const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (transaction.mpesaReceiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (transaction.senderName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
                            (selectedCategory === 'unlabeled' ? !transaction.isLabeled : transaction.category === selectedCategory);
      
      const transactionType = transaction.transactionType === 'credit' ? 'income' : 'expense';
      const matchesType = viewType === 'all' || transactionType === viewType;
      
      return matchesSearch && matchesCategory && matchesType;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 text-lg">
            {loading ? 'Loading your transactions...' : 'Loading categories...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Display */}
        {(error || categoryError) && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700 font-medium">
                  {error || categoryError}
                </span>
              </div>
              <button 
                onClick={() => {
                  setError(null);
                  setCategoryError(null);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Transactions</h1>
              <p className="text-gray-600 text-lg">Track and manage your financial activity</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Filter Bar with Type Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Transaction Type Buttons */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewType('all')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewType === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewType('income')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewType === 'income' 
                    ? 'bg-green-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Income</span>
              </button>
              <button
                onClick={() => setViewType('expense')}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewType === 'expense' 
                    ? 'bg-red-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                <span>Expenses</span>
              </button>
            </div>

            {/* Add Transaction Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Add Transaction</span>
            </button>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="description">Sort by Description</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Add Transaction Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Transaction</h2>
                <button
                  onClick={() => !submitting && setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={submitting}
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      disabled={submitting}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (KSH)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-lg"
                    placeholder="0.00"
                    disabled={submitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    placeholder="What was this transaction for?"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleAddTransaction}
                    disabled={submitting || !newTransaction.amount || !newTransaction.description}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-semibold"
                  >
                    {submitting ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Add Transaction
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => !submitting && setShowAddForm(false)}
                    disabled={submitting}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  {stats.unlabeled} unlabeled
                </span>
                <span>
                  {categories.length} categories available
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => {
                const category = transaction.category ? getCategoryById(transaction.category) : null;
                const transactionType = getTransactionType(transaction);
                const transactionId = transaction.id || transaction._id;
                const isEditingThisCategory = editingCategory === transactionId;
                
                return (
                  <div key={transactionId} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`p-3 rounded-full ${
                          transactionType === 'expense' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {transactionType === 'expense' ? (
                            <ArrowDown className="h-5 w-5 text-red-600" />
                          ) : (
                            <ArrowUp className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {transaction.description || 'No description'}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              {new Date(getTransactionDate(transaction)).toLocaleDateString()}
                            </span>
                            
                            {transaction.mpesaReceiptNumber && (
                              <span className="text-xs text-gray-400">
                                {transaction.mpesaReceiptNumber}
                              </span>
                            )}
                            
                            {/* Category Assignment/Editing */}
                            {transaction.isLabeled && category && !isEditingThisCategory ? (
                              <div className="flex items-center space-x-2">
                                <span 
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: category.color }}
                                >
                                  {category.name}
                                </span>
                                <button
                                  onClick={() => setEditingCategory(transactionId)}
                                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={transaction.category || ''}
                                  onChange={(e) => handleCategoryChange(transactionId, e.target.value)}
                                  className="text-xs border border-gray-300 rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50 border-yellow-300"
                                  disabled={categories.length === 0}
                                >
                                  <option value="">
                                    🏷️ {categories.length === 0 ? 'No categories available' : 
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
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Status Indicator */}
                            {transaction.isLabeled ? (
                              <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">Labeled</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-yellow-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs">Needs Label</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`text-xl font-bold ${
                          transactionType === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transactionType === 'expense' ? '-' : '+'}KSH {(transaction.amount || 0).toLocaleString()}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteTransaction(transactionId)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategory || viewType !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by adding your first transaction'
                  }
                </p>
                {!searchTerm && !selectedCategory && viewType === 'all' && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Your First Transaction</span>
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