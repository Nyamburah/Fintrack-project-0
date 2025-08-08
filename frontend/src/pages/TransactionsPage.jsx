import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit3, Tag, TrendingUp, TrendingDown, 
  Loader, AlertCircle, X, Calendar, DollarSign,
  ArrowUpCircle, ArrowDownCircle, Check
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Transactions Page - Complete transaction management with categorization
 * Integrates with categories system for expense tracking
 */
const TransactionsPage = () => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [categorizingTransaction, setCategorizingTransaction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    type: 'expense' // will be set based on activeTab
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Fixed: Get auth token with proper fallback strategy (same as categories page)
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
        console.warn('No authentication token found in localStorage');
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

  // Enhanced API call helper (same as categories page)
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
        } catch {
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

  // Fetch transactions
  const fetchTransactions = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching transactions...');
      const data = await apiCall('/transactions');
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }
      
      // Validate and format transactions
      const validatedTransactions = data.map(transaction => ({
        _id: transaction._id || transaction.id,
        amount: Number(transaction.amount) || 0,
        description: transaction.description || '',
        type: transaction.type || 'expense',
        transactionDate: transaction.transactionDate || transaction.createdAt,
        category: transaction.category || null,
        isLabeled: Boolean(transaction.category),
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }));
      
      setTransactions(validatedTransactions);
      console.log(`✅ Successfully loaded ${validatedTransactions.length} transactions`);
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      
      if (retryCount < 2 && (
        error.message.includes('Network error') || 
        error.message.includes('timed out')
      )) {
        console.log(`🔄 Retrying... (attempt ${retryCount + 2})`);
        setTimeout(() => fetchTransactions(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Helper functions for categories (simulating context functionality)
  const getCategoryById = useCallback((id) => {
    return categories.find(cat => cat._id === id) || null;
  }, [categories]);

  const updateCategorySpent = useCallback(async (categoryId, newSpentAmount) => {
    try {
      // Update local category state
      setCategories(prev => 
        prev.map(c => c._id === categoryId ? {
          ...c,
          spent: newSpentAmount
        } : c)
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Refresh data function
  const handleRefreshData = useCallback(async () => {
    try {
      setError(null);
      
      // In a real app, this would fetch fresh data from your API
      console.log('🔄 Refreshing transactions and categories...');
      
      // For demo, just clear any errors
      
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      setError(error.message);
    }
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!newTransaction.amount || isNaN(Number(newTransaction.amount))) {
      errors.amount = 'Amount is required and must be a valid number';
    } else if (Number(newTransaction.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!newTransaction.description.trim()) {
      errors.description = 'Description is required';
    } else if (newTransaction.description.trim().length < 3) {
      errors.description = 'Description must be at least 3 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newTransaction]);

  // Reset form
  const resetForm = useCallback(() => {
    setNewTransaction({
      amount: '',
      description: '',
      type: activeTab === 'income' ? 'income' : 'expense'
    });
    setFormErrors({});
  }, [activeTab]);

  // Add new transaction
  const handleAddTransaction = useCallback(async () => {
    if (!validateForm() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const transactionData = {
        amount: Number(newTransaction.amount),
        description: newTransaction.description.trim(),
        type: activeTab === 'income' ? 'income' : 'expense'
      };

      console.log('📝 Creating transaction:', transactionData);
      
      // Simulate API call since we can't make real HTTP requests
      const savedTransaction = {
        _id: Date.now().toString(),
        amount: transactionData.amount,
        description: transactionData.description,
        type: transactionData.type,
        transactionDate: new Date().toISOString(),
        category: null,
        isLabeled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTransactions(prev => [savedTransaction, ...prev]);
      resetForm();
      setShowAddForm(false);
      console.log('✅ Transaction created successfully');
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }, [newTransaction, validateForm, submitting, resetForm, activeTab]);

  // Update transaction
  const handleUpdateTransaction = useCallback(async (id, updates) => {
    if (!id || !updates) return;
    
    try {
      console.log('📝 Updating transaction:', id, updates);
      
      setTransactions(prev => 
        prev.map(transaction => transaction._id === id ? {
          ...transaction,
          ...updates,
          updatedAt: new Date().toISOString()
        } : transaction)
      );
      setEditingTransaction(null);
      setError(null);
      console.log('✅ Transaction updated successfully');
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      setError(error.message);
    }
  }, []);

  // Categorize transaction
  const handleCategorizeTransaction = useCallback(async (transactionId, categoryId) => {
    if (!transactionId || !categoryId) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Find the transaction and category
      const transaction = transactions.find(t => t._id === transactionId);
      const category = getCategoryById(categoryId);
      
      if (!transaction || !category) {
        throw new Error('Transaction or category not found');
      }

      console.log('🏷️ Categorizing transaction:', transactionId, 'to category:', categoryId);
      
      // Update category spent amount
      const newSpentAmount = category.spent + transaction.amount;
      const updateResult = await updateCategorySpent(categoryId, newSpentAmount);
      
      if (updateResult.success) {
        // Update local transaction state
        setTransactions(prev => 
          prev.map(t => t._id === transactionId ? {
            ...t,
            category: { _id: categoryId, name: category.name, color: category.color },
            isLabeled: true
          } : t)
        );

        setCategorizingTransaction(null);
        console.log('✅ Transaction categorized successfully');
      } else {
        throw new Error(updateResult.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('❌ Error categorizing transaction:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }, [transactions, getCategoryById, updateCategorySpent]);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  }, [transactions]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setNewTransaction(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setNewTransaction(prev => ({
      ...prev,
      type: tab === 'income' ? 'income' : 'expense'
    }));
  }, []);

  // Load demo data on component mount
  useEffect(() => {
    // Initialize with some demo data since we can't make real API calls
    const demoTransactions = [
      {
        _id: '1',
        amount: 5000,
        description: 'Salary',
        type: 'income',
        transactionDate: new Date().toISOString(),
        category: null,
        isLabeled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        amount: 1200,
        description: 'Groceries',
        type: 'expense',
        transactionDate: new Date().toISOString(),
        category: null,
        isLabeled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const demoCategories = [
      {
        _id: '1',
        name: 'Food & Dining',
        color: '#ef4444',
        budget: 5000,
        spent: 0
      },
      {
        _id: '2',
        name: 'Transportation',
        color: '#3b82f6',
        budget: 3000,
        spent: 0
      },
      {
        _id: '3',
        name: 'Entertainment',
        color: '#8b5cf6',
        budget: 2000,
        spent: 0
      }
    ];

    setTransactions(demoTransactions);
    setCategories(demoCategories);
    setLoading(false);
  }, []);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddForm && !submitting) {
          setShowAddForm(false);
          resetForm();
        }
        if (categorizingTransaction) {
          setCategorizingTransaction(null);
        }
        if (editingTransaction) {
          setEditingTransaction(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddForm, submitting, categorizingTransaction, editingTransaction, resetForm]);

  const totals = calculateTotals();
  const filteredTransactions = transactions.filter(t => t.type === activeTab.slice(0, -1)); // remove 's' from 'expenses'/'income'

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 flex-1">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                aria-label="Close error message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page Header with Totals */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-2">
                Track your income and expenses with smart categorization.
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={handleRefreshData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2 transition-colors"
              >
                <Loader className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  setNewTransaction(prev => ({
                    ...prev,
                    type: activeTab === 'income' ? 'income' : 'expense'
                  }));
                  setShowAddForm(true);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <ArrowUpCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    KSH {totals.totalIncome.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    KSH {totals.totalExpenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 ${totals.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'} rounded-lg`}>
                  <DollarSign className={`h-6 w-6 ${totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Balance</p>
                  <p className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    KSH {Math.abs(totals.balance).toLocaleString()}
                    {totals.balance < 0 && ' deficit'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => handleTabChange('expenses')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'expenses'
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4" />
                  <span>Expenses ({transactions.filter(t => t.type === 'expense').length})</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('income')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'income'
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Income ({transactions.filter(t => t.type === 'income').length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Transactions List */}
          <div className="p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className={`p-3 ${activeTab === 'expenses' ? 'bg-red-100' : 'bg-emerald-100'} rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                  {activeTab === 'expenses' ? (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start tracking your {activeTab} by adding your first transaction.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Add {activeTab === 'expenses' ? 'Expense' : 'Income'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const isEditing = editingTransaction === transaction._id;
                  const showCategorizeButton = transaction.type === 'expense' && !transaction.isLabeled;

                  return (
                    <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  defaultValue={transaction.description}
                                  onBlur={(e) => {
                                    const newDescription = e.target.value.trim();
                                    if (newDescription && newDescription !== transaction.description) {
                                      handleUpdateTransaction(transaction._id, { description: newDescription });
                                    } else {
                                      setEditingTransaction(null);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.target.blur();
                                    if (e.key === 'Escape') setEditingTransaction(null);
                                  }}
                                  autoFocus
                                  className="border border-emerald-500 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  defaultValue={transaction.amount}
                                  onBlur={(e) => {
                                    const newAmount = parseFloat(e.target.value);
                                    if (newAmount && newAmount !== transaction.amount && newAmount > 0) {
                                      handleUpdateTransaction(transaction._id, { amount: newAmount });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.target.blur();
                                    if (e.key === 'Escape') setEditingTransaction(null);
                                  }}
                                  className="border border-emerald-500 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {transaction.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(transaction.transactionDate).toLocaleDateString('en-KE')}
                                  {transaction.isLabeled && transaction.category && (
                                    <span className="ml-2 inline-flex items-center">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-1" 
                                        style={{ backgroundColor: transaction.category.color }}
                                      />
                                      {transaction.category.name}
                                    </span>
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-semibold ${
                          transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          KSH {transaction.amount.toLocaleString()}
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          {showCategorizeButton && (
                            <button
                              onClick={() => setCategorizingTransaction(transaction)}
                              className="p-1.5 hover:bg-blue-100 rounded transition-colors text-blue-600"
                              title="Categorize transaction"
                            >
                              <Tag className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingTransaction(isEditing ? null : transaction._id)}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-600"
                            title="Edit transaction"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add {activeTab === 'income' ? 'Income' : 'Expense'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount (KSH) *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      formErrors.amount ? 'border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  {formErrors.amount && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.amount}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="Enter description..."
                    disabled={submitting}
                  />
                  {formErrors.description && (
                    <p className="text-red-600 text-xs mt-1">{formErrors.description}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransaction}
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center space-x-2 transition-colors"
                >
                  {submitting ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{submitting ? 'Adding...' : 'Add Transaction'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categorize Transaction Modal */}
        {categorizingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Categorize Transaction
                </h2>
                <button
                  onClick={() => setCategorizingTransaction(null)}
                  disabled={submitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Transaction:</p>
                <p className="font-medium">{categorizingTransaction.description}</p>
                <p className="text-red-600 font-semibold">KSH {categorizingTransaction.amount.toLocaleString()}</p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No categories available. Create categories first.
                  </p>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleCategorizeTransaction(categorizingTransaction._id, category._id)}
                      disabled={submitting}
                      className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-gray-500">
                          Budget: KSH {category.budget.toLocaleString()} | 
                          Spent: KSH {category.spent.toLocaleString()}
                        </p>
                      </div>
                      <Tag className="w-4 h-4 text-gray-400" />
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setCategorizingTransaction(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;