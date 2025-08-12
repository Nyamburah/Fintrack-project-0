import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, Target, 
  TrendingUp, TrendingDown, Palette,
  Loader, AlertCircle, X, Receipt,
  Calendar, DollarSign, Save, RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Optimized Categories Page with Improved Transaction Modal
 * Enhanced performance, better UX, and improved error handling
 */
const CategoriesPage = () => {
  // ✅ Added user + updateUserStats from Auth
  const { user, updateUserStats } = useAuth();

  // Core state management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(null);

  // Transaction states
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3B82F6',
    budget: '',
    description: ''
  });

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: ''
  });

  // Validation states
  const [formErrors, setFormErrors] = useState({});
  const [transactionErrors, setTransactionErrors] = useState({});

  // Available color options
  const colorOptions = useMemo(() => [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#6B7280', '#374151', '#1F2937'
  ], []);

  // Enhanced auth token retrieval
  const getAuthToken = useCallback(() => {
    try {
      const token = localStorage.getItem('authToken') || 
                   JSON.parse(localStorage.getItem('user') || '{}')?.token;
      if (!token) {
        console.warn('No authentication token found');
        window.location.href = '/login';
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
  }, []);

  // Enhanced API call with retry logic
  const apiCall = useCallback(async (endpoint, options = {}, retries = 1) => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Insufficient permissions.';
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

  // ✅ Helper to increment streak (runs once per day)
  const incrementStreakIfNeeded = useCallback(() => {
    const today = new Date().toDateString();
    const lastActivity = user?.lastActivityDate
      ? new Date(user.lastActivityDate).toDateString()
      : null;

    if (lastActivity !== today) {
      const newStreak = (user?.streak || 0) + 1;
      updateUserStats(
        newStreak,
        user?.coins || 0,
        user?.points || 0,
        new Date().toISOString()
      );
    }
  }, [user, updateUserStats]);

  // Optimized category fetching with better error handling
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/categories');
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }
      
      const validatedCategories = data.map(category => ({
        _id: category._id || category.id,
        name: category.name || 'Unnamed Category',
        color: category.color || '#3B82F6',
        budget: Number(category.budget) || 0,
        spent: Number(category.spent) || 0,
        description: category.description || '',
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }));
      
      setCategories(validatedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Optimized transaction fetching
  const fetchTransactions = useCallback(async (categoryId) => {
    if (!categoryId) return;
    
    try {
      setLoadingTransactions(true);
      
      const data = await apiCall(`/transactions/category/${categoryId}`);
      
      const validatedTransactions = (Array.isArray(data) ? data : []).map(transaction => ({
        _id: transaction._id || transaction.id,
        amount: Number(transaction.amount) || 0,
        description: transaction.description || '',
        date: new Date(transaction.date || transaction.createdAt),
        categoryId: transaction.categoryId,
        userId: transaction.userId
      })).sort((a, b) => b.date - a.date); // Sort by date descending
      
      setTransactions(validatedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [apiCall]);

  // Form validation with better UX
  const validateForm = useCallback(() => {
    const errors = {};
    const name = newCategory.name.trim();
    
    if (!name) {
      errors.name = 'Category name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (name.length > 50) {
      errors.name = 'Name must be less than 50 characters';
    } else if (categories.some(cat => 
      cat.name.toLowerCase() === name.toLowerCase() &&
      cat._id !== editingCategory
    )) {
      errors.name = 'A category with this name already exists';
    }
    
    const budget = newCategory.budget;
    if (budget && (isNaN(Number(budget)) || Number(budget) < 0)) {
      errors.budget = 'Budget must be a valid positive number';
    }
    
    if (newCategory.description.length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newCategory, categories, editingCategory]);

  // Transaction form validation
  const validateTransactionForm = useCallback(() => {
    const errors = {};
    const amount = newTransaction.amount;
    const description = newTransaction.description.trim();
    
    if (!amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    }
    
    if (!description) {
      errors.description = 'Description is required';
    } else if (description.length < 2) {
      errors.description = 'Description must be at least 2 characters';
    } else if (description.length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }
    
    setTransactionErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newTransaction]);

  // Reset forms
  const resetForm = useCallback(() => {
    setNewCategory({
      name: '',
      color: '#3B82F6',
      budget: '',
      description: ''
    });
    setFormErrors({});
  }, []);

  const resetTransactionForm = useCallback(() => {
    setNewTransaction({ amount: '', description: '' });
    setTransactionErrors({});
  }, []);

  // Handle form input changes with debounced validation
  const handleInputChange = useCallback((field, value) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  const handleTransactionInputChange = useCallback((field, value) => {
    setNewTransaction(prev => ({ ...prev, [field]: value }));
    
    if (transactionErrors[field]) {
      setTransactionErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [transactionErrors]);

  // Enhanced category operations
  const handleAddCategory = useCallback(async () => {
    if (!validateForm() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const categoryData = {
        name: newCategory.name.trim(),
        color: newCategory.color,
        budget: Number(newCategory.budget) || 0,
        description: newCategory.description.trim()
      };

      const savedCategory = await apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });

      const newCat = {
        _id: savedCategory._id || savedCategory.id,
        name: savedCategory.name,
        color: savedCategory.color,
        budget: Number(savedCategory.budget) || 0,
        spent: Number(savedCategory.spent) || 0,
        description: savedCategory.description || '',
        createdAt: savedCategory.createdAt,
        updatedAt: savedCategory.updatedAt
      };

      setCategories(prev => [newCat, ...prev]);
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }, [newCategory, validateForm, submitting, apiCall, resetForm]);

  const handleUpdateCategory = useCallback(async (id, updates) => {
    if (!id || !updates) return;
    
    try {
      setError(null);

      if (updates.name !== undefined && !updates.name.trim()) {
        setError('Category name cannot be empty');
        return;
      }

      if (updates.name && categories.some(cat => 
        cat._id !== id && 
        cat.name.toLowerCase() === updates.name.trim().toLowerCase()
      )) {
        setError('A category with this name already exists');
        return;
      }
      
      if (updates.budget !== undefined && (isNaN(Number(updates.budget)) || Number(updates.budget) < 0)) {
        setError('Budget must be a valid positive number');
        return;
      }

      const updatedCategory = await apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      setCategories(prev => 
        prev.map(cat => cat._id === id ? { ...cat, ...updatedCategory, _id: cat._id } : cat)
      );
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.message);
    }
  }, [categories, apiCall]);

  const handleDeleteCategory = useCallback(async (id) => {
    if (!id) return;
    
    try {
      await apiCall(`/categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(cat => cat._id !== id));
      setDeleteConfirm(null);
      setError(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error.message);
    }
  }, [apiCall]);

  // Enhanced transaction operations
  const handleAddTransaction = useCallback(async () => {
    if (!validateTransactionForm() || transactionSubmitting || !showTransactionDialog) return;

    try {
      setTransactionSubmitting(true);
      setError(null);
      
      const transactionData = {
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description.trim(),
        categoryId: showTransactionDialog._id
      };

      const savedTransaction = await apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });

      const newTx = {
        _id: savedTransaction._id,
        amount: savedTransaction.amount,
        description: savedTransaction.description,
        date: new Date(savedTransaction.date || savedTransaction.createdAt),
        categoryId: savedTransaction.categoryId,
        userId: savedTransaction.userId
      };

      setTransactions(prev => [newTx, ...prev]);

      // Update category spent amount optimistically
      const updatedSpent = (transactions.reduce((sum, tx) => sum + tx.amount, 0) + newTx.amount);
      setCategories(prev => 
        prev.map(cat => 
          cat._id === showTransactionDialog._id 
            ? { ...cat, spent: updatedSpent }
            : cat
        )
      );

      // ✅ Increment streak after adding a transaction
      incrementStreakIfNeeded();

      resetTransactionForm();
      setShowAddTransaction(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError(error.message);
    } finally {
      setTransactionSubmitting(false);
    }
  }, [
    newTransaction,
    validateTransactionForm,
    transactionSubmitting,
    showTransactionDialog,
    apiCall,
    transactions,
    resetTransactionForm,
    incrementStreakIfNeeded
  ]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    try {
      await apiCall(`/transactions/${transactionId}`, { method: 'DELETE' });

      const deletedTransaction = transactions.find(tx => tx._id === transactionId);
      setTransactions(prev => prev.filter(tx => tx._id !== transactionId));

      if (deletedTransaction && showTransactionDialog) {
        const updatedSpent = transactions
          .filter(tx => tx._id !== transactionId)
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        setCategories(prev => 
          prev.map(cat => 
            cat._id === showTransactionDialog._id 
              ? { ...cat, spent: updatedSpent }
              : cat
          )
        );
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError(error.message);
    }
  }, [apiCall, transactions, showTransactionDialog]);

  // Modal handlers
  const handleOpenTransactionDialog = useCallback((category) => {
    setShowTransactionDialog(category);
    setShowAddTransaction(false);
    resetTransactionForm();
    fetchTransactions(category._id);
  }, [fetchTransactions, resetTransactionForm]);

  const handleCloseModal = useCallback(() => {
    if (!submitting) {
      setShowAddForm(false);
      resetForm();
    }
  }, [submitting, resetForm]);

  // Calculate category statistics
  const getCategoryStats = useCallback((category) => {
    const budget = Number(category.budget) || 0;
    const spent = Number(category.spent) || 0;
    
    const usage = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = budget - spent;

    return {
      usagePercentage: Math.max(0, usage),
      remaining,
      isOverBudget: budget > 0 && spent > budget
    };
  }, []);

  // Format date for display
  const formatDate = useCallback((date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }, []);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Keyboard handlers
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddForm && !submitting) handleCloseModal();
        if (showTransactionDialog && !transactionSubmitting) {
          setShowTransactionDialog(null);
          setTransactions([]);
          setShowAddTransaction(false);
          resetTransactionForm();
        }
        if (deleteConfirm) setDeleteConfirm(null);
        if (editingCategory) setEditingCategory(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddForm, submitting, showTransactionDialog, transactionSubmitting, deleteConfirm, editingCategory, handleCloseModal, resetTransactionForm]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Loading categories...</p>
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
                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0 transition-colors"
                aria-label="Close error message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-2">
              Organize your transactions with custom categories and budgets.
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
              aria-label="Refresh categories"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
        </div>

        {/* Add Category Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Add New Category</h2>
                <button
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="category-name">
                    Name *
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="e.g., Groceries"
                    maxLength={50}
                    disabled={submitting}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {newCategory.name.length}/50
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="category-description">
                    Description
                  </label>
                  <textarea
                    id="category-description"
                    value={newCategory.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Category description (optional)"
                    maxLength={200}
                    rows={3}
                    disabled={submitting}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {formErrors.description && (
                      <span className="text-red-500">{formErrors.description}</span>
                    )}
                    <span className="ml-auto">{newCategory.description.length}/200</span>
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleInputChange('color', color)}
                        disabled={submitting}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 disabled:opacity-50 ${
                          newCategory.color === color
                            ? 'border-black scale-110 ring-2 ring-offset-2 ring-gray-300'
                            : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="category-budget">
                    Budget (KSH)
                  </label>
                  <input
                    id="category-budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCategory.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      formErrors.budget ? 'border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="0"
                    disabled={submitting}
                  />
                  {formErrors.budget && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.budget}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={handleAddCategory}
                    disabled={submitting || !newCategory.name.trim()}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 px-6 rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl font-semibold text-lg border-2 border-emerald-500"
                  >
                    {submitting ? (
                      <Loader className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <>
                        <Save className="h-5 w-5 text-white" />
                        <span className="text-white font-bold">Add Category</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 py-3 px-6 rounded-lg hover:from-gray-300 hover:to-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg font-semibold text-lg border-2 border-gray-300"
                  >
                    <span className="text-gray-800 font-bold">Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Dialog - Much More Distinct */}
        {showTransactionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-4 border-emerald-200">
              
              {/* Dialog Header - More Prominent */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 border-b-4 border-emerald-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full ring-4 ring-white/30"
                        style={{ backgroundColor: showTransactionDialog.color }}
                      />
                      <div>
                        <h2 className="text-2xl font-bold">
                          {showTransactionDialog.name}
                        </h2>
                        <p className="text-emerald-100">
                          Budget: KSH {showTransactionDialog.budget.toLocaleString()} | 
                          Spent: KSH {showTransactionDialog.spent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowTransactionDialog(null);
                      setTransactions([]);
                      setShowAddTransaction(false);
                      resetTransactionForm();
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
                    aria-label="Close dialog"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Single Add Transaction Button in Header */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowAddTransaction(!showAddTransaction)}
                    className="bg-white text-emerald-700 px-6 py-3 rounded-lg hover:bg-emerald-50 flex items-center gap-2 transition-all font-semibold shadow-md"
                  >
                    <Plus className="h-5 w-5" />
                    {showAddTransaction ? 'Cancel' : 'Add New Transaction'}
                  </button>
                </div>
              </div>

              {/* Dialog Content */}
              <div className="flex-1 overflow-y-auto">
                
                {/* Add Transaction Form - More Distinct */}
                {showAddTransaction && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-4 border-blue-200 p-6 m-4 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-blue-600 text-white p-2 rounded-full">
                        <Plus className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-bold text-blue-900">Add New Transaction</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-blue-900" htmlFor="transaction-amount">
                          Amount (KSH) *
                        </label>
                        <input
                          id="transaction-amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={newTransaction.amount}
                          onChange={(e) => handleTransactionInputChange('amount', e.target.value)}
                          className={`w-full border-2 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-medium ${
                            transactionErrors.amount ? 'border-red-500 bg-red-50' : 'border-blue-300 bg-white'
                          }`}
                          placeholder="0.00"
                          disabled={transactionSubmitting}
                        />
                        {transactionErrors.amount && (
                          <p className="text-red-600 text-sm mt-2 font-medium">{transactionErrors.amount}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-blue-900" htmlFor="transaction-description">
                          Description *
                        </label>
                        <input
                          id="transaction-description"
                          type="text"
                          value={newTransaction.description}
                          onChange={(e) => handleTransactionInputChange('description', e.target.value)}
                          className={`w-full border-2 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg ${
                            transactionErrors.description ? 'border-red-500 bg-red-50' : 'border-blue-300 bg-white'
                          }`}
                          placeholder="e.g., Grocery shopping at Carrefour"
                          maxLength={200}
                          disabled={transactionSubmitting}
                        />
                        {transactionErrors.description && (
                          <p className="text-red-600 text-sm mt-2 font-medium">{transactionErrors.description}</p>
                        )}
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          {newTransaction.description.length}/200
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-6 justify-center">
                      <button 
                        type="button"
                        onClick={handleAddTransaction}
                        disabled={transactionSubmitting || !newTransaction.amount || !newTransaction.description.trim()}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-10 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl font-bold text-xl border-2 border-blue-500"
                      >
                        {transactionSubmitting ? (
                          <Loader className="h-6 w-6 animate-spin text-white" />
                        ) : (
                          <>
                            <Save className="h-6 w-6 text-white" />
                            <span className="text-white font-bold">Save Transaction</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Transactions List */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Transaction History ({transactions.length})
                    </h3>
                  </div>

                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-emerald-600" />
                      <span className="ml-3 text-gray-600 text-lg">Loading transactions...</span>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">No transactions yet</h4>
                      <p className="text-gray-600 mb-6 text-lg">
                        Add your first transaction to start tracking spending in this category.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {transactions.map((transaction) => (
                        <div key={transaction._id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                <span className="font-bold text-gray-900 text-lg">
                                  KSH {transaction.amount.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3 break-words text-base">{transaction.description}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(transaction.date)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteTransaction(transaction._id)}
                              className="ml-4 p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                              aria-label="Delete transaction"
                            >
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone and will also delete all associated transactions.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteCategory(deleteConfirm._id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow p-8">
              <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first category to start organizing your transactions.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Add Your First Category
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              if (!category._id) return null;
              
              const stats = getCategoryStats(category);
              const isEditing = editingCategory === category._id;

              return (
                <div key={category._id} className="bg-white rounded-xl shadow hover:shadow-md transition-all duration-200 p-6 border border-gray-100">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-gray-200"
                        style={{ backgroundColor: category.color }}
                      />
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={category.name}
                          onBlur={(e) => {
                            const newName = e.target.value.trim();
                            if (newName && newName !== category.name) {
                              handleUpdateCategory(category._id, { name: newName });
                            } else {
                              setEditingCategory(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                          autoFocus
                          className="border-b border-emerald-500 focus:outline-none bg-transparent flex-1 min-w-0 font-semibold"
                          maxLength={50}
                        />
                      ) : (
                        <h3 className="font-semibold truncate text-gray-900">{category.name}</h3>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button 
                        onClick={() => setEditingCategory(isEditing ? null : category._id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label={isEditing ? "Save changes" : "Edit category"}
                      >
                        {isEditing ? (
                          <Save className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Edit3 className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(category)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-4 break-words line-clamp-2">{category.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Usage</span>
                      <span className={`font-medium ${stats.isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          stats.isOverBudget
                            ? 'bg-red-500'
                            : stats.usagePercentage > 75
                            ? 'bg-yellow-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-medium text-gray-900">KSH {category.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget</span>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={category.budget}
                          onBlur={(e) => {
                            const newBudget = parseFloat(e.target.value) || 0;
                            if (newBudget !== category.budget) {
                              handleUpdateCategory(category._id, { budget: newBudget });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                          className="border-b border-emerald-500 text-right w-24 focus:outline-none bg-transparent font-medium"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">KSH {category.budget.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining</span>
                      <span className={`font-medium ${stats.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        KSH {Math.abs(stats.remaining).toLocaleString()}
                        {stats.remaining < 0 && ' over'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        {stats.isOverBudget ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 font-medium">Over Budget</span>
                          </>
                        ) : stats.usagePercentage > 75 ? (
                          <>
                            <Target className="h-4 w-4 text-yellow-500" />
                            <span className="text-yellow-600 font-medium">Near Limit</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-emerald-500" />
                            <span className="text-emerald-600 font-medium">On Track</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Palette className="h-4 w-4 text-gray-400" />
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                    </div>

                    {/* Transaction Button */}
                    <button
                      onClick={() => handleOpenTransactionDialog(category)}
                      className="w-full bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <Receipt className="h-4 w-4" />
                      Manage Transactions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
