import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  PieChart,
  RefreshCw,
  Loader2
} from 'lucide-react';

/**
 * Financial Reports Page - Connected to Backend
 * Location: src/pages/ReportsPage.jsx
 * 
 * Shows users key spending insights using real data from backend
 */
const ReportsPage = () => {
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  // Helper function to make API calls
  const apiCall = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Load categories and transactions
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, transactionsData] = await Promise.all([
        apiCall('/categories'),
        apiCall('/transactions')
      ]);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Calculate spending by category with real-time data
  const categoryData = useMemo(() => {
    if (!categories || !transactions) return [];

    return categories.map(category => {
      // Filter transactions for this category (only expenses/debits)
      const categoryTransactions = transactions.filter(t => {
        const transactionCategoryId = t.category?._id || t.category?.id || t.category || t.categoryId;
        const categoryId = category._id || category.id;
        const isExpense = t.type === 'expense' || t.transactionType === 'debit';
        
        return transactionCategoryId === categoryId && isExpense;
      });

      // Calculate spent amount from transactions
      const spent = categoryTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const budget = Number(category.budget) || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      
      return {
        ...category,
        spent,
        percentage,
        remaining: Math.max(0, budget - spent),
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good',
        transactionCount: categoryTransactions.length
      };
    });
  }, [categories, transactions]);

  // Calculate overall totals
  const totals = useMemo(() => {
    const totalBudget = categoryData.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalSpent = categoryData.reduce((sum, c) => sum + (c.spent || 0), 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallUsage
    };
  }, [categoryData]);

  // Find biggest expenses from all transactions
  const biggestExpenses = useMemo(() => {
    if (!transactions || !categories) return [];

    const expenseTransactions = transactions.filter(t => 
      t.type === 'expense' || t.transactionType === 'debit'
    );

    return expenseTransactions
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 3)
      .map(t => ({
        ...t,
        categoryName: (() => {
          const transactionCategoryId = t.category?._id || t.category?.id || t.category || t.categoryId;
          const category = categories.find(c => (c._id || c.id) === transactionCategoryId);
          return category?.name || 'Other';
        })()
      }));
  }, [transactions, categories]);

  // Find most spent category
  const topCategory = useMemo(() => {
    if (!categoryData.length) return null;
    return categoryData.reduce((max, current) => 
      (current.spent || 0) > (max.spent || 0) ? current : max
    );
  }, [categoryData]);

  // Calculate transaction statistics
  const transactionStats = useMemo(() => {
    if (!transactions) return { totalTransactions: 0, averagePerTransaction: 0 };

    const expenseTransactions = transactions.filter(t => 
      t.type === 'expense' || t.transactionType === 'debit'
    );
    
    const totalTransactions = expenseTransactions.length;
    const averagePerTransaction = totalTransactions > 0 ? totals.totalSpent / totalTransactions : 0;

    return {
      totalTransactions,
      averagePerTransaction
    };
  }, [transactions, totals.totalSpent]);

  // Format currency for Kenya Shillings
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0).replace('KES', 'KSh');
  };

  // Loading state
  if (loading && !categories.length) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your financial insights...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with refresh button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Spending Insights</h1>
            <p className="text-gray-600 mt-2">See how you're doing with your budget this month</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && (!categories.length || !transactions.length) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-center">
            <PieChart className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-yellow-800 font-medium mb-2">No Data Available</h3>
            <p className="text-yellow-700 text-sm mb-4">
              {!categories.length 
                ? "You haven't created any categories yet. Create some categories first to see your spending insights."
                : "You don't have any transactions yet. Add some transactions to see your spending patterns."
              }
            </p>
            <div className="space-x-4">
              {!categories.length && (
                <a 
                  href="/categories" 
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Create Categories
                </a>
              )}
              <a 
                href="/dashboard" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Show reports only if we have data */}
        {categories.length > 0 && transactions.length > 0 && (
          <>
            {/* Overall Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalSpent)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Budget Left</p>
                    <p className={`text-2xl font-bold ${totals.totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(totals.totalRemaining))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
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
                      You've spent {formatCurrency(totals.totalSpent - totals.totalBudget)} more than your monthly budget. 
                      Consider reviewing your spending in the categories below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Spending by Category</h2>
                
                {categoryData.length > 0 ? (
                  <div className="space-y-4">
                    {categoryData.map((category) => (
                      <div key={category._id || category.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-gray-900">{category.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({category.transactionCount} transactions)
                            </span>
                          </div>
                          <div className="text-right">
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
                              style={{ width: `${Math.min(100, category.percentage)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            category.status === 'over' ? 'text-red-600' : 
                            category.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {category.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No category data available</p>
                  </div>
                )}
              </div>

              {/* Key Insights */}
              <div className="space-y-6">
                
                {/* Biggest Expenses */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Biggest Expenses</h2>
                  {biggestExpenses.length > 0 ? (
                    <div className="space-y-3">
                      {biggestExpenses.map((expense) => (
                        <div key={expense._id || expense.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{expense.description}</p>
                            <p className="text-sm text-gray-500">{expense.categoryName}</p>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <p>No expense transactions found</p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
                  
                  <div className="space-y-4">
                    {topCategory && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Most spent category</span>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: topCategory.color }}
                          />
                          <span className="font-medium">{topCategory.name}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average per transaction</span>
                      <span className="font-medium">
                        {formatCurrency(transactionStats.averagePerTransaction)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total transactions</span>
                      <span className="font-medium">{transactionStats.totalTransactions}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Categories over budget</span>
                      <span className={`font-medium ${categoryData.filter(c => c.status === 'over').length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {categoryData.filter(c => c.status === 'over').length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total budget</span>
                      <span className="font-medium">{formatCurrency(totals.totalBudget)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 Quick Tips</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {totals.overallUsage > 100 ? (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-medium text-red-900 mb-2">You're over budget</h3>
                    <p className="text-sm text-red-800">
                      Try to reduce spending in {topCategory?.name || 'high-spend categories'} or other high-spend categories next month.
                    </p>
                  </div>
                ) : totals.overallUsage > 80 ? (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium text-yellow-900 mb-2">Getting close to budget</h3>
                    <p className="text-sm text-yellow-800">
                      You've used {totals.overallUsage.toFixed(1)}% of your budget. Keep an eye on spending for the rest of the month.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">Great job staying on budget!</h3>
                    <p className="text-sm text-green-800">
                      You're doing well with {formatCurrency(totals.totalRemaining)} left to spend this month.
                    </p>
                  </div>
                )}

                {topCategory && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Your spending pattern</h3>
                    <p className="text-sm text-blue-800">
                      Most of your money goes to {topCategory.name} ({formatCurrency(topCategory.spent)}). 
                      This represents {((topCategory.spent / totals.totalSpent) * 100).toFixed(1)}% of your total spending.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;