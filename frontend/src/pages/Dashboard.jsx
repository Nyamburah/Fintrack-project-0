import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import { useData } from '../hooks/useData';

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

const Dashboard = () => {
  const { user, updateUserStats } = useAuth();
  const {
    transactions,
    categories,
    getLabeledTransactionsToday,
    getUnlabeledTransactions
  } = useData();

  const thisMonthSpending = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      return (
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear() &&
        t.type === 'expense'
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const labeledToday = getLabeledTransactionsToday?.() || 0;
  const unlabeledCount = getUnlabeledTransactions?.().length || 0;

  const recentTransactions = transactions.slice(0, 5);

  const quickActions = [
    {
      to: '/transactions',
      icon: CreditCard,
      label: 'Label Transactions',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100',
      textColor: 'text-blue-700',
      iconBg: 'bg-blue-100'
    },
    {
      to: '/categories',
      icon: Tag,
      label: 'Manage Categories',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100',
      textColor: 'text-purple-700',
      iconBg: 'bg-purple-100'
    },
    {
      to: '/budgets',
      icon: Target,
      label: 'Set Budgets',
      bgColor: 'bg-emerald-50',
      hoverColor: 'hover:bg-emerald-100',
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100'
    },
    {
      to: '/reports',
      icon: BarChart3,
      label: 'View Reports',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100',
      textColor: 'text-orange-700',
      iconBg: 'bg-orange-100'
    }
  ];

  const handleStreakUpdate = () => {
    if (user) {
      const newStreak = (user.streak || 0) + 1;
      const newCoins = (user.coins || 0) + 1;
      const newPoints = (user.points || 0) + (newStreak % 7 === 0 ? 50 : 10);
      updateUserStats(newStreak, newCoins, newPoints);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">Here's your financial overview for today</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <Plus className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`${action.bgColor} ${action.hoverColor} ${action.textColor} p-4 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md`}
                >
                  <div className="text-center">
                    <div className={`${action.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`h-6 w-6 ${action.textColor}`} />
                    </div>
                    <p className="text-sm font-medium">{action.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {unlabeledCount > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    {unlabeledCount} transactions need labeling
                  </span>
                </div>
                <Link to="/transactions" className="text-sm font-medium text-yellow-700 hover:text-yellow-800 underline">
                  Label Now
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Current Streak" value={user?.streak || 0} subtitle="days" icon={Flame} bg="from-orange-500 to-red-500" />
          <StatCard title="Coins Earned" value={user?.coins || 0} subtitle="total" icon={Coins} bg="from-yellow-500 to-orange-500" />
          <StatCard title="Total Points" value={user?.points || 0} subtitle="lifetime" icon={Trophy} bg="from-purple-500 to-pink-500" />
          <StatCard title="Budget Used" value={`${budgetUsed.toFixed(0)}%`} subtitle="this month" icon={Target} bg="from-emerald-500 to-teal-500" />
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader title="Monthly Overview" icon={<Calendar className="h-5 w-5 text-gray-400" />} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <OverviewItem label="Total Spending" value={`KSh ${thisMonthSpending.toLocaleString()}`} />
                <OverviewItem label="Budget Remaining" value={`KSh ${(totalBudget - totalSpent).toLocaleString()}`} color="text-emerald-600" />
                <OverviewItem label="Transactions" value={transactions.length} color="text-blue-600" />
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                  <span>Budget Progress</span>
                  <span className="font-medium">{budgetUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      budgetUsed > 90
                        ? 'bg-red-500'
                        : budgetUsed > 75
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader title="Recent Transactions" icon={<Wallet className="h-5 w-5 text-gray-400" />} />
              <div className="space-y-3 mt-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(transaction => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
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

          {/* Right column */}
          <div className="space-y-6">
            {/* Daily Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h3>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">Labeled Transactions</span>
                <span className="font-semibold text-emerald-600">{labeledToday}</span>
              </div>
              <button
                onClick={handleStreakUpdate}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
              >
                Complete Daily Goal
              </button>
            </div>

            {/* Streak Info */}
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
                    ? 'Start your journey today!'
                    : user?.streak < 7
                    ? `${7 - user.streak} days to unlock weekly bonus!`
                    : 'Amazing! Keep the momentum going!'}
                </p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Week Progress</span>
                    <span>{(user?.streak || 0) % 7}/7</span>
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

// --- Reusable UI Components ---
// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, subtitle, bg, icon: Icon }) => (
  <div className={`bg-gradient-to-br ${bg} p-6 rounded-xl text-white`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-white/70 text-xs">{subtitle}</p>
      </div>
      <div className="bg-white bg-opacity-20 p-3 rounded-lg">
        <Icon className="h-8 w-8" />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title, icon }) => (
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    {icon}
  </div>
);

const OverviewItem = ({ label, value, color = 'text-gray-900' }) => (
  <div className="text-center p-4 bg-gray-50 rounded-lg">
    <p className="text-sm text-gray-600">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const TransactionItem = ({ transaction }) => (
  <div className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg ${transaction.type === 'expense' ? 'bg-red-100' : 'bg-emerald-100'}`}>
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
      <p className={`font-semibold ${transaction.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
        {transaction.type === 'expense' ? '-' : '+'}KSh{transaction.amount.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500">
        {new Date(transaction.date).toLocaleDateString()}
      </p>
    </div>
  </div>
);

export default Dashboard;
