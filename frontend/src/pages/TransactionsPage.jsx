import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Receipt,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  AlertTriangle,
  X,
  ChevronDown,
  FileText,
  Hash,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  CheckCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Enhanced Transactions Page
 * Features:
 * - Beautiful modern design consistent with the app
 * - Simplified transaction display (description, amount, date)
 * - Search and filter functionality
 * - Real-time data fetching with error handling
 * - Responsive design
 * - Loading states and empty states
 */
const TransactionsPage = () => {
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');

  // Add Transaction form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    categoryId: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Enhanced auth token retrieval
  const getAuthToken = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken') || 
                   JSON.parse(localStorage.getItem('user') || '{}')?.token;
      
      if (!token) {
        console.warn('No authentication token found');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }, []);

  // Enhanced API call with retry logic
  const apiCall = useCallback(async (endpoint, options = {}, retries = 1) => {
    const token = getAuthToken();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers,
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
          console.warn('Authentication failed, but continuing...');
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
        if (retries > 0) {
          console.log(`Network error, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return apiCall(endpoint, options, retries - 1);
        }
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }, [getAuthToken]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/transactions');
      
      // Validate and process transaction data
      const validatedTransactions = (Array.isArray(data) ? data : []).map(tx => ({
        id: tx.id || tx._id,
        description: tx.description || 'Transaction',
        amount: Number(tx.amount) || 0,
        transactionDate: tx.transactionDate || tx.date || new Date().toISOString(),
        type: tx.type || 'payment',
        status: tx.status || 'completed',
        categoryId: tx.categoryId || tx.category
      }));
      
      setTransactions(validatedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiCall('/categories');
      const validatedCategories = (Array.isArray(data) ? data : []).map(category => ({
        _id: category._id || category.id,
        name: category.name || 'Unnamed Category',
        color: category.color || '#3B82F6'
      }));
      setCategories(validatedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't set error state for categories as it's not critical
    }
  }, [apiCall]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setIsRefreshing(false);
  };

  // Success popup utility
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!newTransaction.amount || isNaN(Number(newTransaction.amount)) || Number(newTransaction.amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    }
    
    if (!newTransaction.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!newTransaction.categoryId) {
      errors.categoryId = 'Please select a category';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newTransaction]);

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setNewTransaction(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  // Reset form
  const resetForm = useCallback(() => {
    setNewTransaction({
      amount: '',
      description: '',
      categoryId: ''
    });
    setFormErrors({});
  }, []);

  // Handle add transaction
  const handleAddTransaction = useCallback(async () => {
    if (!validateForm() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const transactionData = {
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description.trim(),
        categoryId: newTransaction.categoryId,
        transactionDate: new Date().toISOString()
      };

      const savedTransaction = await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      const newTx = {
        id: savedTransaction.id || savedTransaction._id,
        description: savedTransaction.description,
        amount: savedTransaction.amount,
        transactionDate: savedTransaction.transactionDate || savedTransaction.date,
        type: savedTransaction.type || 'payment',
        status: savedTransaction.status || 'completed',
        categoryId: savedTransaction.categoryId
      };

      setTransactions(prev => [newTx, ...prev]);
      resetForm();
      setShowAddForm(false);
      showSuccess('Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }, [newTransaction, validateForm, submitting, apiCall, resetForm, showSuccess]);

  // Format date for display
  const formatDate = (rawDate) => {
    try {
      let date;
      
      // Handle different date formats
      if (typeof rawDate === 'string' && rawDate.length === 14) {
        // Format: YYYYMMDDHHMMSS
        const year = rawDate.slice(0, 4);
        const month = rawDate.slice(4, 6);
        const day = rawDate.slice(6, 8);
        const hour = rawDate.slice(8, 10);
        const min = rawDate.slice(10, 12);
        const sec = rawDate.slice(12, 14);
        date = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
      } else {
        date = new Date(rawDate);
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return `KES ${numAmount.toLocaleString('en-KE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => {
      const matchesSearch = 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm) ||
        getCategoryName(tx.categoryId).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterBy === 'all' ||
        (filterBy === 'high' && tx.amount >= 1000) ||
        (filterBy === 'low' && tx.amount < 1000);
      
      return matchesSearch && matchesFilter;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        default: // date
          aValue = new Date(a.transactionDate);
          bValue = new Date(b.transactionDate);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [transactions, searchTerm, sortBy, sortOrder, filterBy, categories]);

  // Calculate summary statistics
  const transactionSummary = useMemo(() => {
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const count = transactions.length;
    const average = count > 0 ? total / count : 0;
    const highest = Math.max(...transactions.map(tx => tx.amount), 0);
    
    return { total, count, average, highest };
  }, [transactions]);

  // Load transactions and categories on mount
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  // Loading state
  if (loading && !transactions.length) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: isDark ? '#111827' : '#f9fafb'
        }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p style={{ color: isDark ? '#9CA3AF' : '#4B5563' }}>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pt-6"
      style={{
        backgroundColor: isDark ? '#111827' : '#f9fafb'
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">

        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div 
              className="rounded-lg p-4 shadow-lg border flex items-center gap-3"
              style={{
                backgroundColor: isDark ? '#065F46' : '#D1FAE5',
                borderColor: isDark ? '#047857' : '#10B981',
                color: isDark ? '#ffffff' : '#065F46'
              }}
            >
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* Error Alert */}
        {error && (
          <div 
            className="mb-6 rounded-lg p-4 border"
            style={{
              backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
              borderColor: isDark ? '#DC2626' : '#FECACA'
            }}
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span 
                className="flex-1"
                style={{ color: isDark ? '#FCA5A5' : '#B91C1C' }}
              >
                {error}
              </span>
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0 transition-colors"
                aria-label="Close error message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 
              className="text-3xl font-bold"
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              Transactions
            </h1>
            <p 
              className="mt-2"
              style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
            >
              View and manage your transaction history.
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-6 py-3 rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors whitespace-nowrap"
              style={{
                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                color: isDark ? '#D1D5DB' : '#374151'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark ? '#4B5563' : '#E5E7EB';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isDark ? '#374151' : '#F3F4F6';
              }}
              aria-label="Refresh transactions"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium whitespace-nowrap shadow-md hover:shadow-lg"
              style={{
                backgroundColor: '#10B981',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#10B981';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <Plus className="h-5 w-5" />
              Add New Transaction
            </button>
            <button
              className="px-6 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
              style={{
                backgroundColor: '#3B82F6',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2563EB';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3B82F6';
              }}
              aria-label="Download transactions"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div 
            className="rounded-lg shadow p-6 border"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }}
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                >
                  Total Transactions
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: isDark ? '#ffffff' : '#111827' }}
                >
                  {transactionSummary.count}
                </p>
              </div>
            </div>
          </div>

          <div 
            className="rounded-lg shadow p-6 border"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }}
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                >
                  Total Amount
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: isDark ? '#ffffff' : '#111827' }}
                >
                  {formatCurrency(transactionSummary.total)}
                </p>
              </div>
            </div>
          </div>

          <div 
            className="rounded-lg shadow p-6 border"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }}
          >
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                >
                  Average Amount
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: isDark ? '#ffffff' : '#111827' }}
                >
                  {formatCurrency(transactionSummary.average)}
                </p>
              </div>
            </div>
          </div>

          <div 
            className="rounded-lg shadow p-6 border"
            style={{
              backgroundColor: isDark ? '#1F2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }}
          >
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p 
                  className="text-sm"
                  style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                >
                  Highest Amount
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: isDark ? '#ffffff' : '#111827' }}
                >
                  {formatCurrency(transactionSummary.highest)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div 
          className="rounded-lg shadow p-6 mb-8 border"
          style={{
            backgroundColor: isDark ? '#1F2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#E5E7EB'
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                style={{
                  backgroundColor: isDark ? '#374151' : '#ffffff',
                  borderColor: isDark ? '#4B5563' : '#D1D5DB',
                  color: isDark ? '#ffffff' : '#111827'
                }}
              />
            </div>

            {/* Sort By */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none"
                style={{
                  backgroundColor: isDark ? '#374151' : '#ffffff',
                  borderColor: isDark ? '#4B5563' : '#D1D5DB',
                  color: isDark ? '#ffffff' : '#111827'
                }}
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="description">Sort by Description</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort Order */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none"
                style={{
                  backgroundColor: isDark ? '#374151' : '#ffffff',
                  borderColor: isDark ? '#4B5563' : '#D1D5DB',
                  color: isDark ? '#ffffff' : '#111827'
                }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors appearance-none"
                style={{
                  backgroundColor: isDark ? '#374151' : '#ffffff',
                  borderColor: isDark ? '#4B5563' : '#D1D5DB',
                  color: isDark ? '#ffffff' : '#111827'
                }}
              >
                <option value="all">All Amounts</option>
                <option value="high">High (≥1000 KES)</option>
                <option value="low">Low (&lt;1000 KES)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div 
              className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border"
              style={{
                backgroundColor: isDark ? '#1F2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#E5E7EB'
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: '#10B981',
                      background: 'linear-gradient(to bottom right, #10B981, #059669)'
                    }}
                  >
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: isDark ? '#ffffff' : '#111827' }}
                  >
                    Add New Transaction
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="hover:opacity-70 disabled:opacity-50 transition-opacity p-2 rounded-lg"
                  style={{
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    backgroundColor: isDark ? '#374151' : '#F3F4F6'
                  }}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                
                {/* Amount */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: isDark ? '#E5E7EB' : '#374151' }}
                    htmlFor="transaction-amount"
                  >
                    Amount (KES) *
                  </label>
                  <input
                    id="transaction-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors"
                    style={{
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      borderColor: formErrors.amount ? '#EF4444' : (isDark ? '#4B5563' : '#D1D5DB'),
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                    placeholder="0.00"
                    disabled={submitting}
                  />
                  {formErrors.amount && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: isDark ? '#E5E7EB' : '#374151' }}
                    htmlFor="transaction-description"
                  >
                    Description *
                  </label>
                  <input
                    id="transaction-description"
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors"
                    style={{
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      borderColor: formErrors.description ? '#EF4444' : (isDark ? '#4B5563' : '#D1D5DB'),
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                    placeholder="e.g., Grocery shopping"
                    maxLength={200}
                    disabled={submitting}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: isDark ? '#E5E7EB' : '#374151' }}
                    htmlFor="transaction-category"
                  >
                    Category *
                  </label>
                  <select
                    id="transaction-category"
                    value={newTransaction.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors"
                    style={{
                      backgroundColor: isDark ? '#374151' : '#ffffff',
                      borderColor: formErrors.categoryId ? '#EF4444' : (isDark ? '#4B5563' : '#D1D5DB'),
                      color: isDark ? '#ffffff' : '#111827'
                    }}
                    disabled={submitting}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.categoryId}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={handleAddTransaction}
                    disabled={submitting || !newTransaction.amount || !newTransaction.description.trim()}
                    className="flex-1 py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-semibold text-lg border-2"
                    style={{
                      background: 'linear-gradient(to right, #10B981, #059669)',
                      color: 'white',
                      borderColor: '#10B981'
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <>
                        <Plus className="h-5 w-5 text-white" />
                        <span className="text-white font-bold">Add Transaction</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    disabled={submitting}
                    className="flex-1 py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-semibold text-lg border-2"
                    style={{
                      background: isDark ? 'linear-gradient(to right, #4B5563, #374151)' : 'linear-gradient(to right, #E5E7EB, #D1D5DB)',
                      color: isDark ? '#ffffff' : '#374151',
                      borderColor: isDark ? '#4B5563' : '#D1D5DB'
                    }}
                  >
                    <span className="font-bold">Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div 
          className="rounded-lg shadow border overflow-hidden"
          style={{
            backgroundColor: isDark ? '#1F2937' : '#ffffff',
            borderColor: isDark ? '#374151' : '#E5E7EB'
          }}
        >
          <div 
            className="px-6 py-4 border-b"
            style={{
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }}
          >
            <h2 
              className="text-lg font-semibold"
              style={{ color: isDark ? '#ffffff' : '#111827' }}
            >
              Transaction History ({filteredAndSortedTransactions.length})
            </h2>
          </div>

          {filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt 
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}
              />
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: isDark ? '#ffffff' : '#111827' }}
              >
                {searchTerm || filterBy !== 'all' ? 'No matching transactions' : 'No transactions available'}
              </h3>
              <p 
                style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
              >
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Your transactions will appear here once you add them.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead 
                  style={{
                    backgroundColor: isDark ? '#374151' : '#f9fafb'
                  }}
                >
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                    >
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Description</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                    >
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Date & Time</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody 
                  className="divide-y"
                  style={{
                    backgroundColor: isDark ? '#1F2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#E5E7EB'
                  }}
                >
                  {filteredAndSortedTransactions.map((tx, index) => (
                    <tr 
                      key={tx.id || index} 
                      className="transition-colors cursor-pointer"
                      style={{
                        backgroundColor: isDark ? '#1F2937' : '#ffffff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#1F2937' : '#ffffff';
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p 
                              className="text-sm font-medium truncate"
                              style={{ color: isDark ? '#F3F4F6' : '#111827' }}
                              title={tx.description}
                            >
                              {tx.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-green-100 p-2 rounded-lg mr-3"> 
                          </div>
                          <span 
                            className="text-sm font-semibold"
                            style={{ color: isDark ? '#F3F4F6' : '#111827' }}
                          >
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-orange-100 p-2 rounded-lg mr-3">
                            <Calendar className="h-4 w-4 text-orange-600" />
                          </div>
                          <span 
                            className="text-sm"
                            style={{ color: isDark ? '#F3F4F6' : '#111827' }}
                          >
                            {formatDate(tx.transactionDate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;