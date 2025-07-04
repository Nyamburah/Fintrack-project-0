import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { 
  Wallet, 
  Target, 
  Calendar,
  Flame,
  Coins,
  Trophy,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Tag,
  BarChart3,
  Plus
} from 'lucide-react';

/**
 * Dashboard Component
 * 
 * This is the main dashboard that users see after logging in.
 * It provides an overview of their financial status, streak information,
 * and quick access to key features.
 * 
 * Features:
 * - User stats overview (streak, coins, points)
 * - Financial summary (spending, budget status)
 * - Recent transactions
 * - Quick action buttons at the top
 * - Streak status and motivation
 */
const Dashboard = () => {
  const { user, updateUserStats } = useAuth();
  const { transactions, categories, getLabeledTransactionsToday, getUnlabeledTransactions } = useData();

  // Calculate financial summaries
  const thisMonthSpending = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear() &&
             t.type === 'expense';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const labeledToday = getLabeledTransactionsToday();
  const unlabeledCount = getUnlabeledTransactions().length;

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Quick action items
  const quickActions = [
    {
      to: '/transactions',
      icon: CreditCard,
      label: 'Label Transactions',
      color: 'blue',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      textColor: 'text-blue-700',
      iconBg: 'bg-blue-100'
    },
    {
      to: '/categories',
      icon: Tag,
      label: 'Manage Categories',
      color: 'purple',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      textColor: 'text-purple-700',
      iconBg: 'bg-purple-100'
    },
    {
      to: '/budgets',
      icon: Target,
      label: 'Set Budgets',
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:bg-emerald-100',
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100'
    },
    {
      to: '/reports',
      icon: BarChart3,
      label: 'View Reports',
      color: 'orange',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      textColor: 'text-orange-700',
      iconBg: 'bg-orange-100'
    }
  ];

  /**
   * Handle Streak Update
   * 
   * DATABASE INTEGRATION POINT:
   * This should update the user's streak, coins, and points in the database
   * Call this when user completes daily labeling task
   */
  const handleStreakUpdate = () => {
    if (user) {
      const newStreak = user.streak + 1;
      const newCoins = user.coins + 1;
      const newPoints = user.points + (newStreak % 7 === 0 ? 50 : 10);
      
      updateUserStats(newStreak, newCoins, newPoints);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your financial overview for today
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <Plus className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`${action.bgColor} ${action.hoverColor} ${action.textColor} p-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md`}
                >
                  <div className="text-center">
                    <div className={`${action.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className={`h-6 w-6 ${action.textColor}`} />
                    </div>
                    <p className="text-sm font-medium">{action.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Action indicator if there are unlabeled transactions */}
          {unlabeledCount > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    {unlabeledCount} transactions need labeling
                  </span>
                </div>
                <Link
                  to="/transactions"
                  className="text-sm font-medium text-yellow-700 hover:text-yellow-800 underline"
                >
                  Label Now
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Streak Card */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Current Streak</p>
                <p className="text-3xl font-bold">{user?.streak || 0}</p>
                <p className="text-orange-100 text-xs">days</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Flame className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Coins Card */}
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Coins Earned</p>
                <p className="text-3xl font-bold">{user?.coins || 0}</p>
                <p className="text-yellow-100 text-xs">total</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Coins className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Points Card */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Points</p>
                <p className="text-3xl font-bold">{user?.points || 0}</p>
                <p className="text-purple-100 text-xs">lifetime</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Trophy className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Budget Status Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Budget Used</p>
                <p className="text-3xl font-bold">{budgetUsed.toFixed(0)}%</p>
                <p className="text-emerald-100 text-xs">this month</p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Target className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Financial Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Monthly Overview</h2>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Spending</p>
                  <p className="text-2xl font-bold text-gray-900">₹{thisMonthSpending.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Budget Remaining</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{(totalBudget - totalSpent).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Budget Progress</span>
                  <span className="text-sm font-medium">{budgetUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      budgetUsed > 90 ? 'bg-red-500' : 
                      budgetUsed > 75 ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                <Wallet className="h-5 w-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'expense' ? 'bg-red-100' : 'bg-emerald-100'
                        }`}>
                          {transaction.type === 'expense' ? (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <ArrowUp className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{transaction.mpesaCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'expense' ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Daily Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Labeled Transactions</span>
                  <span className="font-semibold text-emerald-600">{labeledToday}</span>
                </div>

                <button
                  onClick={handleStreakUpdate}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm font-medium"
                >
                  Complete Daily Goal
                </button>
              </div>
            </div>

            {/* Streak Status */}
            <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-6">
              <div className="text-center">
                <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {user?.streak || 0} Day Streak!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {user?.streak === 0 
                    ? "Start your journey today!" 
                    : user?.streak && user.streak < 7 
                    ? `${7 - user.streak} days to unlock weekly bonus!`
                    : "Amazing! Keep the momentum going!"
                  }
                </p>
                
                {/* Streak Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Week Progress</span>
                    <span>{((user?.streak || 0) % 7)}/7</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(((user?.streak || 0) % 7) / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Complete daily tasks to maintain your streak and earn rewards!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;