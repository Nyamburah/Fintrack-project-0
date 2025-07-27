import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit3, Trash2, Target, 
  TrendingUp, TrendingDown, Palette,
  Loader, AlertCircle, X 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Categories Page - Fixed Version
 * Comprehensive bug fixes and improvements
 */
const CategoriesPage = () => {
  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // New category form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3B82F6',
    budget: '',
    description: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});

  // Available color options
  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#6B7280', '#374151', '#1F2937'
  ];

  // Get auth token with error handling
  const getAuthToken = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      return user?.token || null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
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
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        if (response.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
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

  // Fetch categories with retry logic
  const fetchCategories = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiCall('/categories');
      
      // Validate response data
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }
      
      // Ensure each category has required fields with defaults
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
      
      // Retry logic for network errors
      if (retryCount < 2 && (
        error.message.includes('Network error') || 
        error.message.includes('timed out')
      )) {
        setTimeout(() => fetchCategories(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!newCategory.name.trim()) {
      errors.name = 'Category name is required';
    } else if (newCategory.name.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters';
    } else if (newCategory.name.trim().length > 50) {
      errors.name = 'Category name must be less than 50 characters';
    }

    // Check for duplicate names
    if (categories.some(cat => 
      cat.name.toLowerCase() === newCategory.name.trim().toLowerCase()
    )) {
      errors.name = 'A category with this name already exists';
    }
    
    if (newCategory.budget && isNaN(Number(newCategory.budget))) {
      errors.budget = 'Budget must be a valid number';
    } else if (Number(newCategory.budget) < 0) {
      errors.budget = 'Budget cannot be negative';
    }
    
    if (newCategory.description.length > 200) {
      errors.description = 'Description must be less than 200 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newCategory, categories]);

  // Reset form
  const resetForm = useCallback(() => {
    setNewCategory({
      name: '',
      color: '#3B82F6',
      budget: '',
      description: ''
    });
    setFormErrors({});
  }, []);

  // Add new category with validation
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

      // Ensure the saved category has all required fields
      const validatedCategory = {
        _id: savedCategory._id || savedCategory.id,
        name: savedCategory.name,
        color: savedCategory.color,
        budget: Number(savedCategory.budget) || 0,
        spent: Number(savedCategory.spent) || 0,
        description: savedCategory.description || '',
        createdAt: savedCategory.createdAt,
        updatedAt: savedCategory.updatedAt
      };

      setCategories(prev => [validatedCategory, ...prev]);
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  }, [newCategory, validateForm, submitting, apiCall, resetForm]);

  // Update category with validation
  const handleUpdateCategory = useCallback(async (id, updates) => {
    if (!id || !updates) return;
    
    try {
      // Validate updates
      if (updates.name !== undefined) {
        if (!updates.name.trim()) {
          setError('Category name cannot be empty');
          return;
        }
        if (categories.some(cat => 
          cat._id !== id && 
          cat.name.toLowerCase() === updates.name.trim().toLowerCase()
        )) {
          setError('A category with this name already exists');
          return;
        }
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
        prev.map(cat => cat._id === id ? {
          ...cat,
          ...updatedCategory,
          _id: cat._id // Ensure ID consistency
        } : cat)
      );
      setEditingCategory(null);
      setError(null);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.message);
    }
  }, [categories, apiCall]);

  // Delete category with confirmation
  const handleDeleteCategory = useCallback(async (id) => {
    if (!id) return;
    
    try {
      await apiCall(`/categories/${id}`, {
        method: 'DELETE'
      });

      setCategories(prev => prev.filter(cat => cat._id !== id));
      setDeleteConfirm(null);
      setError(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error.message);
    }
  }, [apiCall]);

  // Calculate category statistics with safety checks
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

  // Handle form input changes
  const handleInputChange = useCallback((field, value) => {
    setNewCategory(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    if (!submitting) {
      setShowAddForm(false);
      resetForm();
    }
  }, [submitting, resetForm]);

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showAddForm && !submitting) {
          handleCloseModal();
        }
        if (deleteConfirm) {
          setDeleteConfirm(null);
        }
        if (editingCategory) {
          setEditingCategory(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAddForm, submitting, deleteConfirm, editingCategory, handleCloseModal]);

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
                className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
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
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 sm:mt-0 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
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
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
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
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="category-description">
                    Description
                  </label>
                  <input
                    id="category-description"
                    type="text"
                    value={newCategory.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Category description"
                    maxLength={200}
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
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    {submitting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add Category'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Category</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
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
              if (!category._id) return null; // Skip invalid categories
              
              const stats = getCategoryStats(category);
              const isEditing = editingCategory === category._id;

              return (
                <div key={category._id} className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
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
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                            if (e.key === 'Escape') {
                              setEditingCategory(null);
                            }
                          }}
                          autoFocus
                          className="border-b border-emerald-500 focus:outline-none bg-transparent flex-1 min-w-0"
                          maxLength={50}
                        />
                      ) : (
                        <h3 className="font-semibold truncate">{category.name}</h3>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button 
                        onClick={() => setEditingCategory(isEditing ? null : category._id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Edit category"
                      >
                        <Edit3 className="w-4 h-4 text-blue-500" />
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
                    <p className="text-sm text-gray-600 mb-4 break-words">{category.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Usage</span>
                      <span className={`${stats.isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
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
                      <span>Spent</span>
                      <span className="font-medium">KSH {category.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Budget</span>
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
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                            if (e.key === 'Escape') {
                              setEditingCategory(null);
                            }
                          }}
                          className="border-b border-emerald-500 text-right w-24 focus:outline-none bg-transparent"
                        />
                      ) : (
                        <span className="font-medium">KSH {category.budget.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining</span>
                      <span className={`font-medium ${stats.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        KSH {Math.abs(stats.remaining).toLocaleString()}
                        {stats.remaining < 0 && ' over'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Color Info */}
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm">
                      {stats.isOverBudget ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Over Budget</span>
                        </>
                      ) : stats.usagePercentage > 75 ? (
                        <>
                          <Target className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-600">Near Limit</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-emerald-500" />
                          <span className="text-emerald-600">On Track</span>
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