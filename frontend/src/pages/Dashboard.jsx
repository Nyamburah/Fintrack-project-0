import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import {
  Target,
  Flame,
  AlertTriangle,
  Tag,
  BarChart3,
  Plus,
  Lightbulb,
  Quote
} from 'lucide-react';

const Dashboard = () => {
  const { user, updateUserStats } = useAuth();
  const {
    transactions,
    categories,
    getLabeledTransactionsToday,
    getUnlabeledTransactions
  } = useData();

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const unlabeledCount = getUnlabeledTransactions?.().length || 0;

  // Assume user has streak and lastActivityDate
  const currentStreak = user?.streak || 0;

  // Check if user has completed today's activity based on lastActivityDate
  const completedToday = () => {
    if (!user?.lastActivityDate) return false;
    const today = new Date().toDateString();
    const lastActivity = new Date(user.lastActivityDate).toDateString();
    return lastActivity === today;
  };

  const isCompletedToday = completedToday();

  const handleStreakUpdate = () => {
    if (!isCompletedToday) {
      const newStreak = currentStreak + 1;
      const lastActivityDate = new Date().toISOString();
      updateUserStats(newStreak, user?.coins || 0, user?.points || 0, lastActivityDate);
    }
  };

  const quickActions = [
    {
      to: '/categories',
      icon: Tag,
      label: 'Do Your Thing!',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100',
      textColor: 'text-green-700',
      iconBg: 'bg-green-100'
    },
    {
      to: '/reports',
      icon: BarChart3,
      label: 'See How You Did!',
      bgColor: 'bg-lime-50',
      hoverColor: 'hover:bg-lime-100',
      textColor: 'text-lime-700',
      iconBg: 'bg-lime-100'
    }
  ];

  const financialTips = [
    {
      title: 'Track Every Expense',
      content: 'Log all your spending to identify saving opportunities.',
      icon: Lightbulb,
      bgFrom: 'from-green-100',
      bgTo: 'to-lime-100'
    },
    {
      title: 'Build an Emergency Fund',
      content: 'Aim for 3-6 months of living expenses in savings.',
      icon: Lightbulb,
      bgFrom: 'from-lime-100',
      bgTo: 'to-emerald-100'
    },
    {
      title: 'Set SMART Goals',
      content: 'Make your financial goals Specific, Measurable, Achievable, Relevant, and Time-bound.',
      icon: Lightbulb,
      bgFrom: 'from-emerald-100',
      bgTo: 'to-green-100'
    }
  ];

  const motivationQuotes = [
    {
      quote: 'The best way to predict the future is to create it.',
      author: 'Peter Drucker',
      bgFrom: 'from-green-50',
      bgTo: 'to-lime-50'
    },
    {
      quote: 'Rich people believe "I create my life." Poor people believe "Life happens to me."',
      author: 'T. Harv Eker',
      bgFrom: 'from-lime-50',
      bgTo: 'to-emerald-50'
    },
    {
      quote: 'Don\'t save what is left after spending; spend what is left after saving.',
      author: 'Warren Buffett',
      bgFrom: 'from-emerald-50',
      bgTo: 'to-green-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Streak */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-green-900">
              Welcome back, {user?.name}! 🌿
            </h1>
            <p className="text-green-700 text-lg mt-2 font-medium">Dive into your financial jungle today!</p>
          </div>
          <div className="flex items-center bg-lime-100 rounded-full px-5 py-3 shadow-md">
            <Flame className="h-7 w-7 text-orange-500 mr-3" />
            <span className="text-xl font-bold text-orange-700">{currentStreak} days</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10 border border-green-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-green-900">Quick Actions</h2>
            <Plus className="h-6 w-6 text-green-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  onClick={action.to === '/categories' ? handleStreakUpdate : undefined}
                  className={`${action.bgColor} ${action.hoverColor} ${action.textColor} p-6 rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:rotate-1`}
                >
                  <div className="text-center">
                    <div className={`${action.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md`}>
                      <Icon className={`h-8 w-8 ${action.textColor}`} />
                    </div>
                    <p className="text-base font-bold">{action.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {unlabeledCount > 0 && (
            <div className="mt-8 bg-yellow-50 border border-yellow-300 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <span className="text-base font-medium text-yellow-800">
                    {unlabeledCount} transactions need labeling
                  </span>
                </div>
                <Link to="/transactions" className="text-base font-bold text-yellow-700 hover:text-yellow-900 underline">
                  Label Now
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section - Only Budget Used */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <StatCard title="Budget Used" value={`${budgetUsed.toFixed(0)}%`} subtitle="this month" icon={Target} bg="from-emerald-600 to-green-600" />
        </div>

        {/* Content Section - Removed Today's Progress, fill with tips */}
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-green-900 mb-8">Financial Tips & Motivation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {financialTips.map((tip, index) => (
              <TipCard key={`tip-${index}`} {...tip} />
            ))}
            {motivationQuotes.map((motivation, index) => (
              <MotivationCard key={`motivation-${index}`} {...motivation} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable UI Components
const StatCard = ({ title, value, subtitle, bg, icon: Icon }) => (
  <div className={`bg-gradient-to-br ${bg} p-8 rounded-3xl text-white shadow-2xl hover:shadow-3xl transition-shadow duration-300 hover:scale-105`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/90 text-base font-bold">{title}</p>
        <p className="text-4xl font-extrabold">{value}</p>
        <p className="text-white/80 text-sm">{subtitle}</p>
      </div>
      <div className="bg-white bg-opacity-30 p-4 rounded-full">
        <Icon className="h-10 w-10" />
      </div>
    </div>
  </div>
);

const TipCard = ({ title, content, icon: Icon, bgFrom, bgTo }) => (
  <div className={`bg-gradient-to-br ${bgFrom} ${bgTo} rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-subtleColorShift`}>
    <div className="flex items-start space-x-5">
      <div className="bg-yellow-200 p-4 rounded-full">
        <Icon className="h-7 w-7 text-yellow-700" />
      </div>
      <div>
        <h4 className="text-xl font-bold text-green-900 mb-3">{title}</h4>
        <p className="text-base text-green-800">{content}</p>
      </div>
    </div>
  </div>
);

const MotivationCard = ({ quote, author, bgFrom, bgTo }) => (
  <div className={`bg-gradient-to-br ${bgFrom} ${bgTo} rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-subtleColorShift`}>
    <div className="flex flex-col h-full">
      <Quote className="h-7 w-7 text-lime-600 mb-5" />
      <p className="text-base font-bold text-green-900 flex-grow">"{quote}"</p>
      <p className="text-sm text-green-700 mt-5 text-right">- {author}</p>
    </div>
  </div>
);

export default Dashboard;