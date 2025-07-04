import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  Target,
  DollarSign,
  PieChart,
  Download} from 'lucide-react';

/**
 * Reports Page Component
 * 
 * This page provides comprehensive financial reports and analytics.
 * Users can view spending patterns, trends, and insights across different time periods.
 * 
 * Features:
 * - Daily, weekly, monthly, quarterly, and annual reports
 * - Category-wise spending analysis
 * - Time-based spending patterns
 * - Budget vs actual comparisons
 * - Spending trends and insights
 * - Export functionality
 * 
 * DATABASE INTEGRATION POINTS:
 * - Historical transaction data for trend analysis
 * - Aggregated spending data by time periods
 * - Category performance metrics
 */
const ReportsPage = () => {
  const { transactions, categories, getCategorySpending } = useData();
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  // eslint-disable-next-line no-empty-pattern
  const [] = useState('');

  // Calculate spending by time periods
  const getSpendingByPeriod = (period) => {
    const now = new Date();
    const data = [];
    
    // eslint-disable-next-line default-case
    switch (period) {
      case 'daily':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const daySpending = transactions
            .filter(t => 
              new Date(t.date).toDateString() === date.toDateString() && 
              t.type === 'expense'
            )
            .reduce((sum, t) => sum + t.amount, 0);
          
          data.push({
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            value: daySpending,
            date: date.toISOString()
          });
        }
        break;
        
      case 'weekly':
        // Last 8 weeks
        for (let i = 7; i >= 0; i--) {
          const startDate = new Date(now);
          startDate.setDate(startDate.getDate() - (i * 7) - startDate.getDay());
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          
          const weekSpending = transactions
            .filter(t => {
              const tDate = new Date(t.date);
              return tDate >= startDate && tDate <= endDate && t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
          
          data.push({
            label: `Week ${8 - i}`,
            value: weekSpending,
            date: startDate.toISOString()
          });
        }
        break;
        
      case 'monthly':
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthSpending = transactions
            .filter(t => {
              const tDate = new Date(t.date);
              return tDate.getMonth() === date.getMonth() && 
                     tDate.getFullYear() === date.getFullYear() && 
                     t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
          
          data.push({
            label: date.toLocaleDateString('en-US', { month: 'short' }),
            value: monthSpending,
            date: date.toISOString()
          });
        }
        break;
        
      case 'quarterly':
        // Last 4 quarters
        for (let i = 3; i >= 0; i--) {
          const quarter = Math.floor(now.getMonth() / 3) - i;
          const year = now.getFullYear() + Math.floor(quarter / 4);
          const adjustedQuarter = ((quarter % 4) + 4) % 4;
          
          const startMonth = adjustedQuarter * 3;
          const startDate = new Date(year, startMonth, 1);
          const endDate = new Date(year, startMonth + 3, 0);
          
          const quarterSpending = transactions
            .filter(t => {
              const tDate = new Date(t.date);
              return tDate >= startDate && tDate <= endDate && t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
          
          data.push({
            label: `Q${adjustedQuarter + 1} ${year}`,
            value: quarterSpending,
            date: startDate.toISOString()
          });
        }
        break;
        
      case 'annual':
        // Last 3 years
        for (let i = 2; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const yearSpending = transactions
            .filter(t => {
              const tDate = new Date(t.date);
              return tDate.getFullYear() === year && t.type === 'expense';
            })
            .reduce((sum, t) => sum + t.amount, 0);
          
          data.push({
            label: year.toString(),
            value: yearSpending,
            date: new Date(year, 0, 1).toISOString()
          });
        }
        break;
    }
    
    return data;
  };

  // Get category spending distribution
  const getCategoryDistribution = () => {
    return categories.map(category => ({
      name: category.name,
      value: getCategorySpending(category.id, selectedPeriod),
      color: category.color,
      budget: category.budget
    })).filter(cat => cat.value > 0);
  };

  // Get spending by time of day
  const getSpendingByTimeOfDay = () => {
    const hourlySpending = Array(24).fill(0);
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const hour = new Date(t.date).getHours();
        hourlySpending[hour] += t.amount;
      });
    
    return hourlySpending.map((amount, hour) => ({
      hour: `${hour}:00`,
      amount
    }));
  };

  // Get spending by day of week
  const getSpendingByDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailySpending = Array(7).fill(0);
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const day = new Date(t.date).getDay();
        dailySpending[day] += t.amount;
      });
    
    return dailySpending.map((amount, index) => ({
      day: days[index],
      amount
    }));
  };

  const spendingData = getSpendingByPeriod(selectedPeriod);
  const categoryDistribution = getCategoryDistribution();
  const timeOfDayData = getSpendingByTimeOfDay();
  const dayOfWeekData = getSpendingByDayOfWeek();

  // Calculate insights
  const totalSpending = spendingData.reduce((sum, item) => sum + item.value, 0);
  const averageSpending = totalSpending / spendingData.length;
  const highestSpending = Math.max(...spendingData.map(item => item.value));
  // eslint-disable-next-line no-unused-vars
  const lowestSpending = Math.min(...spendingData.map(item => item.value));

  // Find peak spending times
  const peakHour = timeOfDayData.reduce((max, current) => 
    current.amount > max.amount ? current : max
  );
  const peakDay = dayOfWeekData.reduce((max, current) => 
    current.amount > max.amount ? current : max
  );

  // Calculate trends
  const isIncreasingTrend = spendingData.length > 1 && 
    spendingData[spendingData.length - 1].value > spendingData[spendingData.length - 2].value;

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-2">
              Analyze your spending patterns and financial trends
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="daily">Daily (7 days)</option>
              <option value="weekly">Weekly (8 weeks)</option>
              <option value="monthly">Monthly (6 months)</option>
              <option value="quarterly">Quarterly (4 quarters)</option>
              <option value="annual">Annual (3 years)</option>
            </select>
            
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spending</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalSpending.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">This {selectedPeriod.slice(0, -2)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Spending</p>
                <p className="text-2xl font-bold text-gray-900">₹{averageSpending.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Per {selectedPeriod.slice(0, -2)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Highest Spending</p>
                <p className="text-2xl font-bold text-gray-900">₹{highestSpending.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Peak period</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className={`text-2xl font-bold ${isIncreasingTrend ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isIncreasingTrend ? 'Rising' : 'Falling'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Spending trend</p>
              </div>
              <div className={`p-3 rounded-lg ${isIncreasingTrend ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {isIncreasingTrend ? (
                  <TrendingUp className="h-6 w-6 text-red-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-emerald-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Spending Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Spending Trend</h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {spendingData.map((item, index) => {
                const maxValue = Math.max(...spendingData.map(d => d.value));
                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-16 text-sm text-gray-600">{item.label}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-20 text-sm font-medium text-gray-900 text-right">
                      ₹{item.value.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Category Breakdown</h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {categoryDistribution.map((category, index) => {
                const totalCategorySpending = categoryDistribution.reduce((sum, cat) => sum + cat.value, 0);
                const percentage = totalCategorySpending > 0 ? (category.value / totalCategorySpending) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-900">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{category.value.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {categoryDistribution.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No spending data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spending Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Time of Day Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Spending by Time</h2>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Peak spending time: <span className="font-medium text-gray-900">{peakHour.hour}</span>
              </p>
              <p className="text-sm text-gray-600">
                Amount: <span className="font-medium text-gray-900">₹{peakHour.amount.toLocaleString()}</span>
              </p>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {timeOfDayData
                .filter(item => item.amount > 0)
                .map((item, index) => {
                  const maxAmount = Math.max(...timeOfDayData.map(d => d.amount));
                  const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 text-xs text-gray-600">{item.hour}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-xs text-gray-900 text-right">
                        ₹{item.amount.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Day of Week Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Spending by Day</h2>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Highest spending day: <span className="font-medium text-gray-900">{peakDay.day}</span>
              </p>
              <p className="text-sm text-gray-600">
                Amount: <span className="font-medium text-gray-900">₹{peakDay.amount.toLocaleString()}</span>
              </p>
            </div>
            
            <div className="space-y-3">
              {dayOfWeekData.map((item, index) => {
                const maxAmount = Math.max(...dayOfWeekData.map(d => d.amount));
                const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-20 text-sm text-gray-600">{item.day}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-20 text-sm font-medium text-gray-900 text-right">
                      ₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Spending Trend</h3>
              </div>
              <p className="text-sm text-blue-800">
                Your spending is {isIncreasingTrend ? 'increasing' : 'decreasing'} compared to the previous period.
                {isIncreasingTrend 
                  ? ' Consider reviewing your budget and identifying areas to cut back.'
                  : ' Great job on reducing your expenses!'
                }
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium text-purple-900">Peak Spending Time</h3>
              </div>
              <p className="text-sm text-purple-800">
                You spend most at {peakHour.hour} and on {peakDay.day}s. 
                Being aware of these patterns can help you make more mindful spending decisions.
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-emerald-600" />
                <h3 className="font-medium text-emerald-900">Budget Performance</h3>
              </div>
              <p className="text-sm text-emerald-800">
                {categoryDistribution.length > 0 
                  ? `Your top spending category is ${categoryDistribution[0]?.name}. Consider setting a specific budget for better control.`
                  : 'Start categorizing your transactions to get better insights into your spending patterns.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;