import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, Target, 
  TrendingUp, TrendingDown, Palette,
  Loader, AlertCircle 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Categories Page - Connected to Backend
 * Manages categories with real API integration
 */
const CategoriesPage = () => {
  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New category form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#3B82F6',
    budget: 0,
    description: ''
  });

  // Available color options
  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
    '#F43F5E', '#6B7280', '#374151', '#1F2937'
  ];

  // Get auth token from localStorage
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token;
  };

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall('/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      setSubmitting(true);
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

      setCategories(prev => [savedCategory, ...prev]);
      setNewCategory({ name: '', color: '#3B82F6', budget: 0, description: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Update category
  const handleUpdateCategory = async (id, updates) => {
    try {
      const updatedCategory = await apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      setCategories(prev => 
        prev.map(cat => cat._id === id ? updatedCategory : cat)
      );
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.message);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? This cannot be undone.')) return;

    try {
      await apiCall(`/categories/${id}`, {
        method: 'DELETE'
      });

      setCategories(prev => prev.filter(cat => cat._id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error.message);
    }
  };

  // Calculate category statistics
  const getCategoryStats = (category) => {
    const usage = category.budget > 0 
      ? (category.spent / category.budget) * 100 
      : 0;
    const remaining = category.budget - category.spent;

    return {
      usagePercentage: usage,
      remaining,
      isOverBudget: category.budget > 0 && category.spent > category.budget
    };
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

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
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
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
            className="mt-4 sm:mt-0 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Add Category Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Category</h2>
              <div className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Groceries"
                    required
                    maxLength={50}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Category description"
                    maxLength={200}
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          newCategory.color === color
                            ? 'border-black scale-110'
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium mb-1">Budget (KSH)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCategory.budget}
                    onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={handleAddCategory}
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {submitting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add Category'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    disabled={submitting}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
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
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
              >
                Add Your First Category
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const stats = getCategoryStats(category);
              const isEditing = editingCategory === category._id;

              return (
                <div key={category._id} className="bg-white rounded-xl shadow p-6">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={category.name}
                          onBlur={(e) => {
                            if (e.target.value.trim() && e.target.value !== category.name) {
                              handleUpdateCategory(category._id, { name: e.target.value.trim() });
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
                          className="border-b border-emerald-500 focus:outline-none bg-transparent"
                          maxLength={50}
                        />
                      ) : (
                        <h3 className="font-semibold">{category.name}</h3>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingCategory(isEditing ? null : category._id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit3 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category._id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Usage</span>
                      <span className={`${stats.isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        {stats.usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className={`h-2 rounded-full ${
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
                      <span>KSH {category.spent.toLocaleString()}</span>
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
                          className="border-b border-emerald-500 text-right w-20 focus:outline-none bg-transparent"
                        />
                      ) : (
                        <span>KSH {category.budget.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining</span>
                      <span className={stats.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}>
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