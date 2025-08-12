import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  AlertTriangle,
  PieChart,
  RefreshCw,
  Loader2,
  Receipt,
  Calendar,
  X
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Financial Reports Page - Simplified and Consistent
 * Uses same data structure and calculations as CategoriesPage
 */
const ReportsPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced auth token retrieval (same as CategoriesPage)
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

  // Enhanced API call (same as CategoriesPage)
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

  // Fetch categories (same validation as CategoriesPage)
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

  // Calculate category statistics (same as CategoriesPage)
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

  // Load data on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCategories();
    setIsRefreshing(false);
  };

  // Calculate overall totals using same logic as CategoriesPage
  const totals = useMemo(() => {
    const totalBudget = categories.reduce((sum, category) => {
      return sum + (Number(category.budget) || 0);
    }, 0);
    
    const totalSpent = categories.reduce((sum, category) => {
      return sum + (Number(category.spent) || 0);
    }, 0);
    
    const totalRemaining = totalBudget - totalSpent;
    const overallUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const categoriesOverBudget = categories.filter(cat => {
      const stats = getCategoryStats(cat);
      return stats.isOverBudget;
    }).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallUsage,
      categoriesOverBudget
    };
  }, [categories, getCategoryStats]);

  // Enhanced category data with statistics
  const categoryData = useMemo(() => {
    return categories.map(category => {
      const stats = getCategoryStats(category);
      return {
        ...category,
        ...stats,
        status: stats.isOverBudget ? 'over' : stats.usagePercentage > 80 ? 'warning' : 'good'
      };
    }).sort((a, b) => (b.spent || 0) - (a.spent || 0)); // Sort by spending descending
  }, [categories, getCategoryStats]);

  // Top spending category
  const topCategory = useMemo(() => {
    const categoriesWithSpending = categoryData.filter(cat => cat.spent > 0);
    return categoriesWithSpending.length > 0 ? categoriesWithSpending[0] : null;
  }, [categoryData]);

  // Categories needing attention
  const attentionCategories = useMemo(() => {
    return categoryData.filter(cat => cat.status === 'over' || cat.status === 'warning');
  }, [categoryData]);

  // Format currency
  const formatCurrency = (amount) => {
    const numAmount = Math.abs(Number(amount)) || 0;
    return `KSh ${numAmount.toLocaleString('en-KE', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    })}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'over': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  // Get status background
  const getStatusBackground = (status) => {
    switch (status) {
      case 'over': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-green-50 border-green-200';
    }
  };

  // Loading state
  if (loading && !categories.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Loading your financial reports...</p>
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
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-2">
              Get insights into your spending patterns and budget performance.
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
              aria-label="Refresh reports"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* No Data State */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow p-8">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-600 mb-4">
                Create some categories and add transactions to see your financial reports.
              </p>
              <a
                href="/categories"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Create Categories
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Overall Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Budget</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalBudget)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalSpent)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className={`text-2xl font-bold ${totals.totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(totals.totalRemaining))}
                      {totals.totalRemaining < 0 && <span className="text-sm font-normal"> over</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${totals.overallUsage > 100 ? 'bg-red-100' : totals.overallUsage > 80 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    {totals.overallUsage > 100 ? 
                      <TrendingUp className="h-6 w-6 text-red-600" /> : 
                      <TrendingDown className="h-6 w-6 text-green-600" />
                    }
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Budget Used</p>
                    <p className={`text-2xl font-bold ${totals.overallUsage > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                      {totals.overallUsage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Status Alert */}
            {totals.overallUsage > 100 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-red-800 font-medium">Budget Exceeded</h3>
                    <p className="text-red-700 text-sm">
                      You've exceeded your total budget by {formatCurrency(totals.totalSpent - totals.totalBudget)}. 
                      Review the categories below to identify areas for adjustment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              
              {/* Category Breakdown */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Spending by Category</h2>
                
                <div className="space-y-4">
                  {categoryData.map((category) => (
                    <div key={category._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center flex-1 min-w-0">
                          <div 
                            className="w-4 h-4 rounded-full mr-3 flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium text-gray-900 truncate">{category.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(category.spent)}
                          </div>
                          <div className="text-sm text-gray-500">
                            of {formatCurrency(category.budget)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              category.status === 'over' ? 'bg-red-500' : 
                              category.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, category.usagePercentage)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium flex-shrink-0 ${getStatusColor(category.status)}`}>
                          {category.usagePercentage.toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          category.status === 'over' ? 'bg-red-100 text-red-800' :
                          category.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {category.status === 'over' ? 'Over Budget' :
                           category.status === 'warning' ? 'Near Limit' : 'On Track'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary and Insights */}
              <div className="space-y-6">
                
                {/* Quick Stats */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Categories</span>
                      <span className="font-medium">{categories.length}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Over Budget</span>
                      <span className={`font-medium ${totals.categoriesOverBudget > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {totals.categoriesOverBudget}
                      </span>
                    </div>

                    {topCategory && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Highest Spending</span>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: topCategory.color }}
                          />
                          <span className="font-medium">{topCategory.name}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget Utilization</span>
                      <span className={`font-medium ${getStatusColor(
                        totals.overallUsage > 100 ? 'over' : totals.overallUsage > 80 ? 'warning' : 'good'
                      )}`}>
                        {totals.overallUsage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
                  
                  <div className="space-y-4">
                    {totals.overallUsage > 100 ? (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <div className="flex">
                          <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-red-900">Budget Exceeded</h3>
                            <p className="text-sm text-red-700 mt-1">
                              Consider reducing spending or increasing budgets for next period.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : totals.overallUsage > 80 ? (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <div className="flex">
                          <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-yellow-900">Approaching Budget Limit</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              Monitor spending carefully for the rest of this period.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div className="flex">
                          <Target className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-green-900">On Track</h3>
                            <p className="text-sm text-green-700 mt-1">
                              Great job staying within budget! Keep it up.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Needing Attention */}
            {attentionCategories.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories Needing Attention</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attentionCategories.map((category) => (
                    <div key={category._id} className={`p-4 rounded-lg border ${getStatusBackground(category.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className={`text-sm font-medium ${getStatusColor(category.status)}`}>
                          {category.usagePercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Spent: {formatCurrency(category.spent)} of {formatCurrency(category.budget)}
                      </div>
                      {category.isOverBudget && (
                        <div className="text-sm text-red-600 mt-1">
                          Over by {formatCurrency(Math.abs(category.remaining))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;