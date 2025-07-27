import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  PieChart
} from 'lucide-react';

/**
 * Budget Page Component
 * 
 * This page provides comprehensive budget management and tracking.
 * Users can view their budget performance, set new budgets, and get insights.
 * 
 * Features:
 * - Overall budget overview
 * - Category-wise budget tracking
 * - Budget vs actual spending comparison
 * - Budget recommendations
 * - Historical budget performance
 * 
 * DATABASE INTEGRATION POINTS:
 * - Budget data should be stored with categories
 * - Historical spending data for trend analysis
 * - Budget alerts and notifications
 */
const BudgetPage = () => {
  const { categories, updateCategory, getCategorySpending } = useData();
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  // eslint-disable-next-line no-empty-pattern
  const [] = useState(false);

  // Calculate overall budget statistics
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Get categories with budget analysis
  const categoriesWithAnalysis = categories.map(category => {
    const spent = getCategorySpending(category.id, selectedPeriod);
    const usage = category.budget > 0 ? (spent / category.budget) * 100 : 0;
    const remaining = category.budget - spent;
    const isOverBudget = spent > category.budget && category.budget > 0;
    
    return {
      ...category,
      currentSpent: spent,
      usage,
      remaining,
      isOverBudget,
      status: isOverBudget ? 'over' : usage > 75 ? 'warning' : 'good'
    };
  });

  // Sort categories by usage percentage (highest first)
  const sortedCategories = [...categoriesWithAnalysis].sort((a, b) => b.usage - a.usage);

  // Get budget recommendations
  const getBudgetRecommendations = () => {
    const recommendations = [];
    
    // Check for over-budget categories
    const overBudgetCategories = categoriesWithAnalysis.filter(cat => cat.isOverBudget);
    if (overBudgetCategories.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Over Budget Alert',
        message: `${overBudgetCategories.length} categories are over budget. Consider adjusting spending or increasing budgets.`
      });
    }

    // Check for unused budget
    const underutilizedCategories = categoriesWithAnalysis.filter(cat => cat.usage < 50 && cat.budget > 0);
    if (underutilizedCategories.length > 0) {
      recommendations.push({
        type: 'info',
        title: 'Budget Optimization',
        message: `You have unused budget in ${underutilizedCategories.length} categories. Consider reallocating funds.`
      });
    }

    // Check for categories without budgets
    const noBudgetCategories = categoriesWithAnalysis.filter(cat => cat.budget === 0);
    if (noBudgetCategories.length > 0) {
      recommendations.push({
        type: 'suggestion',
        title: 'Set Budgets',
        message: `${noBudgetCategories.length} categories don't have budgets set. Setting budgets helps track spending.`
      });
    }

    return recommendations;
  };

  const recommendations = getBudgetRecommendations();

  // Handle budget update
  const handleBudgetUpdate = (categoryId, newBudget) => {
    updateCategory(categoryId, { budget: newBudget });
  };

  // Quick budget setup based on spending patterns
  const suggestBudgetFromSpending = (categoryId) => {
    const category = categoriesWithAnalysis.find(cat => cat.id === categoryId);
    if (!category) return 0;

    // Suggest 120% of current spending as budget
    return Math.ceil(category.currentSpent * 1.2 / 100) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
            <p className="text-gray-600 mt-2">
              Track your spending against budgets and optimize your financial plan
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>

        {/* Overall Budget Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ₹{Math.abs(totalRemaining).toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${totalRemaining >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {totalRemaining >= 0 ? (
                  <TrendingDown className="h-6 w-6 text-emerald-600" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Used</p>
                <p className="text-2xl font-bold text-gray-900">{overallUsage.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.type === 'warning' ? 'bg-red-50 border-red-500' :
                    rec.type === 'info' ? 'bg-blue-50 border-blue-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {rec.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : rec.type === 'info' ? (
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    ) : (
                      <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    <div>
                      <h3 className={`font-medium ${
                        rec.type === 'warning' ? 'text-red-900' :
                        rec.type === 'info' ? 'text-blue-900' :
                        'text-yellow-900'
                      }`}>
                        {rec.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        rec.type === 'warning' ? 'text-red-700' :
                        rec.type === 'info' ? 'text-blue-700' :
                        'text-yellow-700'
                      }`}>
                        {rec.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Budget Details */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Category Budgets</h2>
            <p className="text-gray-600 mt-1">Manage budgets for each spending category</p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {sortedCategories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.status === 'over' ? 'bg-red-100 text-red-800' :
                        category.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {category.status === 'over' ? 'Over Budget' :
                         category.status === 'warning' ? 'Near Limit' : 'On Track'}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        ₹{category.currentSpent.toLocaleString()} / ₹{category.budget.toLocaleString()}
                      </p>
                      <p className={`text-sm font-medium ${
                        category.isOverBudget ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {category.usage.toFixed(1)}% used
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          category.isOverBudget ? 'bg-red-500' :
                          category.usage > 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(category.usage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Budget Amount</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={category.budget}
                          onChange={(e) => handleBudgetUpdate(category.id, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      
                      {category.budget === 0 && category.currentSpent > 0 && (
                        <button
                          onClick={() => handleBudgetUpdate(category.id, suggestBudgetFromSpending(category.id))}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors duration-200"
                        >
                          Suggest: ₹{suggestBudgetFromSpending(category.id).toLocaleString()}
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-600">Remaining</p>
                      <p className={`text-sm font-medium ${
                        category.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        ₹{Math.abs(category.remaining).toLocaleString()}
                        {category.remaining < 0 && ' over'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-500">
                    Create categories first to set up budgets
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Budget Tips */}
        <div className="mt-8 bg-emerald-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-3">💰 Budget Management Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-800">
            <div>
              <h4 className="font-medium mb-1">50/30/20 Rule</h4>
              <p>Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Regular Reviews</h4>
              <p>Review your budgets monthly and adjust based on your spending patterns and life changes.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Emergency Buffer</h4>
              <p>Keep a 10-15% buffer in your budgets to account for unexpected expenses.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Track Progress</h4>
              <p>Monitor your budget usage weekly to stay on track and make adjustments early.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;