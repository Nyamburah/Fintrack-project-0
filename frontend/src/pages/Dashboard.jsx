import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { useTheme } from '../contexts/ThemeContext';
import {
  Target,
  Flame,
  AlertTriangle,
  Tag,
  BarChart3,
  Plus,
  Lightbulb,
  Quote,
  Receipt,
  DollarSign,
  Award,
  Star
} from 'lucide-react';

const Dashboard = () => {
  const { user, updateUserStats } = useAuth();
  const { isDark } = useTheme();
  const {
    transactions,
    categories,
    getLabeledTransactionsToday,
    getUnlabeledTransactions
  } = useData();

  // Add loading state and debug info
  if (user === undefined) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.125rem',
        color: isDark ? '#9CA3AF' : '#6B7280',
        gap: '1rem'
      }}>
        <div>Loading dashboard...</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          Debug: User data loading...
        </div>
      </div>
    );
  }

  // Add error boundary for debugging
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.125rem',
        color: '#EF4444',
        gap: '1rem'
      }}>
        <div>⚠️ Authentication Error</div>
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
          User not found. Please try logging in again.
        </div>
        <Link to="/login" style={{
          backgroundColor: '#10B981',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          textDecoration: 'none'
        }}>
          Go to Login
        </Link>
      </div>
    );
  }

  // Streak tracking states
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isStreakIncreasing, setIsStreakIncreasing] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [lastTransactionDate, setLastTransactionDate] = useState(null);

  // Defensive programming - ensure arrays exist
  const safeTransactions = transactions || [];
  const safeCategories = categories || [];

  const totalBudget = safeCategories.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = safeCategories.reduce((sum, c) => sum + (c.spent || 0), 0);
  const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const unlabeledCount = getUnlabeledTransactions?.().length || 0;

  // Format currency in KES
  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return `KES ${numAmount.toLocaleString('en-KE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Utility function to get date in YYYY-MM-DD format
  const getDateString = (date) => {
    return new Date(date).toISOString().split('T')[0];
  };

  // Utility function to check if date is today
  const isToday = (dateString) => {
    return dateString === getDateString(new Date());
  };

  // Utility function to check if date is yesterday
  const isYesterday = (dateString) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateString === getDateString(yesterday);
  };

  // Calculate streak based on consecutive days with transactions
  const calculateStreak = useCallback(() => {
    if (!safeTransactions || safeTransactions.length === 0) {
      return { streak: 0, lastDate: null };
    }

    // Get unique dates with transactions, sorted by date (most recent first)
    const transactionDates = [...new Set(
      safeTransactions.map(tx => getDateString(tx.transactionDate || tx.date || new Date()))
    )].sort((a, b) => new Date(b) - new Date(a));

    if (transactionDates.length === 0) {
      return { streak: 0, lastDate: null };
    }

    let streak = 0;
    let currentDate = new Date();
    const todayString = getDateString(currentDate);
    const latestTransactionDate = transactionDates[0];

    // If no transaction today or yesterday, streak is broken
    if (!isToday(latestTransactionDate) && !isYesterday(latestTransactionDate)) {
      return { streak: 0, lastDate: latestTransactionDate };
    }

    // Start counting from the most recent transaction date
    let checkDate = latestTransactionDate;
    let checkDateObj = new Date(checkDate + 'T00:00:00');
    
    // Count consecutive days
    for (let i = 0; i < transactionDates.length; i++) {
      const transactionDate = transactionDates[i];
      const expectedDate = getDateString(checkDateObj);
      
      if (transactionDate === expectedDate) {
        streak++;
        // Move to previous day
        checkDateObj.setDate(checkDateObj.getDate() - 1);
      } else {
        // Gap found, stop counting
        break;
      }
    }

    return { streak, lastDate: latestTransactionDate };
  }, [safeTransactions]);

  // Load streak from localStorage and calculate current streak
  const loadStreak = useCallback(() => {
    const savedStreak = localStorage.getItem('fintrack_streak');
    const savedLastDate = localStorage.getItem('fintrack_last_transaction_date');
    
    const calculated = calculateStreak();
    
    if (savedStreak && savedLastDate) {
      const saved = {
        streak: parseInt(savedStreak, 10),
        lastDate: savedLastDate
      };
      
      // Use calculated streak if it's more recent or higher
      if (calculated.lastDate && calculated.lastDate >= saved.lastDate) {
        setCurrentStreak(calculated.streak);
        setLastTransactionDate(calculated.lastDate);
        // Save updated values
        localStorage.setItem('fintrack_streak', calculated.streak.toString());
        localStorage.setItem('fintrack_last_transaction_date', calculated.lastDate);
      } else {
        setCurrentStreak(saved.streak);
        setLastTransactionDate(saved.lastDate);
      }
    } else {
      setCurrentStreak(calculated.streak);
      setLastTransactionDate(calculated.lastDate);
      // Save initial values
      localStorage.setItem('fintrack_streak', calculated.streak.toString());
      if (calculated.lastDate) {
        localStorage.setItem('fintrack_last_transaction_date', calculated.lastDate);
      }
    }
  }, [calculateStreak]);

  // Check for streak increase when transactions change
  const checkStreakIncrease = useCallback(() => {
    const calculated = calculateStreak();
    const savedStreak = parseInt(localStorage.getItem('fintrack_streak') || '0', 10);
    const savedLastDate = localStorage.getItem('fintrack_last_transaction_date');
    
    // Check if this is a new day with first transaction
    if (calculated.streak > savedStreak || 
        (calculated.lastDate && calculated.lastDate !== savedLastDate && isToday(calculated.lastDate))) {
      
      // Trigger streak increase animation
      setIsStreakIncreasing(true);
      setTimeout(() => setIsStreakIncreasing(false), 2000);
      
      // Show celebration for milestones
      if (calculated.streak > 0 && (calculated.streak % 5 === 0 || calculated.streak === 1)) {
        setShowStreakCelebration(true);
        setTimeout(() => setShowStreakCelebration(false), 3000);
      }
      
      setCurrentStreak(calculated.streak);
      setLastTransactionDate(calculated.lastDate);
      
      // Save to localStorage
      localStorage.setItem('fintrack_streak', calculated.streak.toString());
      if (calculated.lastDate) {
        localStorage.setItem('fintrack_last_transaction_date', calculated.lastDate);
      }
    }
  }, [calculateStreak]);

  // Load streak on mount
  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  // Check for streak updates when transactions change
  useEffect(() => {
    if (safeTransactions && safeTransactions.length > 0) {
      checkStreakIncrease();
    }
  }, [safeTransactions, checkStreakIncrease]);

  // Main container styles
  const containerStyles = {
    minHeight: '100vh',
    background: isDark 
      ? 'linear-gradient(to bottom right, #111827, #1F2937, #111827)' 
      : 'linear-gradient(to bottom right, #ECFDF5, #F0FDFA, #F0FDF4)',
    position: 'relative',
    overflow: 'hidden'
  };

  const contentStyles = {
    position: 'relative',
    width: '100%',
    padding: '2rem 1rem'
  };

  const headerStyles = {
    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    borderRadius: '1.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: '2rem',
    marginBottom: '2.5rem',
    border: `1px solid ${isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(255, 255, 255, 0.5)'}`,
    position: 'relative',
    overflow: 'hidden'
  };

  const welcomeTextStyles = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #10B981, #059669)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 0.5rem 0'
  };

  const subtitleStyles = {
    fontSize: '1.125rem',
    color: isDark ? '#9CA3AF' : '#6B7280',
    margin: 0
  };

  // Enhanced glowing streak styles with animation support
  const streakStyles = {
    background: isStreakIncreasing 
      ? 'linear-gradient(to bottom right, #FBBF24, #F59E0B, #D97706)' 
      : 'linear-gradient(to bottom right, #F97316, #EF4444, #EC4899)',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: isStreakIncreasing 
      ? '0 25px 50px -12px rgba(251, 191, 36, 0.5), 0 0 60px rgba(251, 191, 36, 0.3)' 
      : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '1.5rem',
    transform: isStreakIncreasing ? 'scale(1.05)' : 'scale(1)',
    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  const streakContentStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    zIndex: 2
  };

  const streakIconStyles = {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: '1rem',
    borderRadius: '0.75rem',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transform: isStreakIncreasing ? 'rotate(360deg) scale(1.2)' : 'rotate(0deg) scale(1)',
    transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  // Get streak milestone message
  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your first streak!";
    if (currentStreak === 1) return "Great start! 🎉";
    if (currentStreak < 5) return "Building momentum! 💪";
    if (currentStreak < 10) return "You're on fire! 🔥";
    if (currentStreak < 20) return "Streak master! ⭐";
    if (currentStreak < 30) return "Incredible dedication! 🏆";
    return "Legendary streak! 👑";
  };

  // Get streak color based on length
  const getStreakColor = () => {
    if (currentStreak === 0) return '#6B7280';
    if (currentStreak < 5) return '#10B981';
    if (currentStreak < 10) return '#F59E0B';
    if (currentStreak < 20) return '#EF4444';
    return '#8B5CF6';
  };

  const quickActionsStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  };

  const cardStyles = {
    background: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)'}`,
    transition: 'all 0.2s',
    cursor: 'pointer',
    textDecoration: 'none'
  };

  const statsGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = '#10B981' }) => (
    <div style={{
      ...cardStyles,
      background: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ 
            fontSize: '0.875rem', 
            color: isDark ? '#9CA3AF' : '#6B7280',
            margin: '0 0 0.5rem 0'
          }}>
            {title}
          </p>
          <p style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#111827',
            margin: 0
          }}>
            {value}
          </p>
          {trend && (
            <span style={{
              fontSize: '0.75rem',
              color: trend > 0 ? '#10B981' : '#EF4444',
              fontWeight: '500'
            }}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div style={{
          backgroundColor: `${color}20`,
          padding: '0.75rem',
          borderRadius: '0.5rem'
        }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  const ActionCard = ({ title, description, icon: Icon, to, onClick, color = '#10B981' }) => (
    <Link 
      to={to} 
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          backgroundColor: `${color}20`,
          padding: '0.75rem',
          borderRadius: '0.5rem'
        }}>
          <Icon size={24} style={{ color }} />
        </div>
        <div>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600',
            color: isDark ? '#ffffff' : '#111827',
            margin: '0 0 0.25rem 0'
          }}>
            {title}
          </h3>
          <p style={{ 
            fontSize: '0.875rem',
            color: isDark ? '#9CA3AF' : '#6B7280',
            margin: 0
          }}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  );

  const TipCard = ({ title, content }) => (
    <div style={{
      ...cardStyles,
      background: 'linear-gradient(to bottom right, #10B981, #059669)',
      color: 'white',
      border: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          padding: '0.5rem',
          borderRadius: '0.5rem'
        }}>
          <Lightbulb size={20} />
        </div>
        <div>
          <h4 style={{ fontWeight: '600', margin: '0 0 0.5rem 0' }}>{title}</h4>
          <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>{content}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={containerStyles}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.6,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div style={contentStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(13, 148, 136, 0.05))',
            borderRadius: '1.5rem'
          }} />
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8rem',
            height: '8rem',
            background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), transparent)',
            borderRadius: '50%',
            transform: 'translate(2rem, -2rem)'
          }} />
          
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={welcomeTextStyles}>Welcome back, {user?.name || 'User'}!</h1>
              <p style={subtitleStyles}>Here's your financial overview for today</p>
            </div>
            
            {/* Enhanced Smart Streak Display */}
            <div style={streakStyles}>
              {/* Dynamic animated glow background */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: isStreakIncreasing 
                  ? 'linear-gradient(45deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3))' 
                  : 'linear-gradient(to right, rgba(251, 191, 36, 0.2), rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.2))',
                borderRadius: '1rem',
                animation: isStreakIncreasing ? 'pulse 0.8s infinite' : 'pulse 2s infinite'
              }} />
              
              {/* Celebration particles when streak increases */}
              {isStreakIncreasing && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: '8px',
                    height: '8px',
                    background: '#FBBF24',
                    borderRadius: '50%',
                    animation: 'ping 0.5s infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '20%',
                    width: '6px',
                    height: '6px',
                    background: '#F59E0B',
                    borderRadius: '50%',
                    animation: 'bounce 0.6s infinite'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '80%',
                    width: '10px',
                    height: '10px',
                    background: '#D97706',
                    borderRadius: '50%',
                    animation: 'ping 0.7s infinite'
                  }} />
                </>
              )}
              
              {/* Normal floating particles */}
              <div style={{
                position: 'absolute',
                top: '15%',
                left: '15%',
                width: '6px',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: '50%',
                animation: 'bounce 2s infinite'
              }} />
              <div style={{
                position: 'absolute',
                top: '70%',
                right: '15%',
                width: '4px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                animation: 'ping 1s infinite',
                animationDelay: '0.5s'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '20%',
                left: '75%',
                width: '5px',
                height: '5px',
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '50%',
                animation: 'ping 1s infinite',
                animationDelay: '1s'
              }} />
              
              <div style={streakContentStyles}>
                <div style={streakIconStyles}>
                  {currentStreak >= 10 ? (
                    <Award size={32} color="#FEF3C7" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }} />
                  ) : currentStreak >= 5 ? (
                    <Star size={32} color="#FEF3C7" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }} />
                  ) : (
                    <Flame size={32} color="#FEF3C7" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    color: '#FEF3C7', 
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 0.25rem 0',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    Daily Transaction Streak
                  </p>
                  <p style={{ 
                    fontSize: isStreakIncreasing ? '2.25rem' : '2rem', 
                    fontWeight: '900',
                    color: 'white',
                    margin: '0 0 0.25rem 0',
                    textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                    transform: isStreakIncreasing ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.4s ease'
                  }}>
                    {currentStreak} day{currentStreak !== 1 ? 's' : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <div style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        backgroundColor: getStreakColor(),
                        borderRadius: '50%',
                        animation: isStreakIncreasing ? 'bounce 0.5s infinite' : 'bounce 1s infinite'
                      }} />
                      <div style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        backgroundColor: getStreakColor(),
                        borderRadius: '50%',
                        animation: isStreakIncreasing ? 'bounce 0.5s infinite' : 'bounce 1s infinite',
                        animationDelay: '0.1s'
                      }} />
                      <div style={{
                        width: '0.5rem',
                        height: '0.5rem',
                        backgroundColor: getStreakColor(),
                        borderRadius: '50%',
                        animation: isStreakIncreasing ? 'bounce 0.5s infinite' : 'bounce 1s infinite',
                        animationDelay: '0.2s'
                      }} />
                    </div>
                    <span style={{ 
                      color: '#FEF3C7', 
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                      animation: isStreakIncreasing ? 'pulse 0.5s infinite' : 'none'
                    }}>
                      {getStreakMessage()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Streak increase notification */}
              {isStreakIncreasing && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '20px',
                  backgroundColor: '#059669',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '1.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  animation: 'bounce 1s infinite',
                  zIndex: 10
                }}>
                  +1 Streak! 🎉
                </div>
              )}
            </div>

            {/* Celebration Modal for Milestones */}
            {showStreakCelebration && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fade-in 0.3s ease-out'
              }}>
                <div style={{
                  backgroundColor: isDark ? '#1F2937' : '#ffffff',
                  borderRadius: '1rem',
                  padding: '2rem',
                  textAlign: 'center',
                  maxWidth: '400px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  animation: 'bounce 0.6s ease-out'
                }}>
                  <div style={{
                    fontSize: '4rem',
                    marginBottom: '1rem',
                    animation: 'bounce 1s infinite'
                  }}>
                    {currentStreak === 1 ? '🎉' : currentStreak % 5 === 0 ? '🏆' : '⭐'}
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: isDark ? '#ffffff' : '#111827',
                    marginBottom: '0.5rem'
                  }}>
                    {currentStreak === 1 ? 'First Transaction!' : `${currentStreak} Day Streak!`}
                  </h3>
                  <p style={{
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    marginBottom: '1.5rem'
                  }}>
                    {currentStreak === 1 
                      ? 'You\'ve started your transaction streak! Keep it up!'
                      : `Amazing! You've been consistent for ${currentStreak} days straight!`
                    }
                  </p>
                  <button
                    onClick={() => setShowStreakCelebration(false)}
                    style={{
                      backgroundColor: '#10B981',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={quickActionsStyles}>
          <ActionCard
            title="Add Transaction"
            description="Record your income or expenses"
            icon={Plus}
            to="/transactions"
            color="#10B981"
          />
          <ActionCard
            title="Manage Categories"
            description="Set budgets and track spending"
            icon={Tag}
            to="/categories"
            color="#8B5CF6"
          />
          <ActionCard
            title="View Reports"
            description="Analyze your financial patterns"
            icon={BarChart3}
            to="/reports"
            color="#F97316"
          />
          {unlabeledCount > 0 && (
            <ActionCard
              title={`${unlabeledCount} Unlabeled Transactions`}
              description="Categorize pending transactions"
              icon={AlertTriangle}
              to="/transactions"
              color="#EF4444"
            />
          )}
        </div>

        {/* Stats Overview */}
        <div style={statsGridStyles}>
          <StatCard
            title="Total Transactions"
            value={safeTransactions.length}
            icon={Receipt}
            trend={safeTransactions.length > 0 ? 5 : 0}
            color="#10B981"
          />
          <StatCard
            title="Total Categories"
            value={safeCategories.length}
            icon={Tag}
            trend={safeCategories.length > 0 ? 3 : 0}
            color="#8B5CF6"
          />
          <StatCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            icon={Target}
            trend={totalBudget > 0 ? 12 : 0}
            color="#3B82F6"
          />
          <StatCard
            title="Total Spent"
            value={formatCurrency(totalSpent)}
            icon={DollarSign}
            trend={budgetUsed > 100 ? -Math.round(budgetUsed - 100) : Math.round(budgetUsed)}
            color="#F97316"
          />
        </div>

        {/* Financial Tips */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#111827',
            marginBottom: '1rem'
          }}>
            💡 Financial Tips & Motivation
          </h2>
          <div style={quickActionsStyles}>
            <TipCard
              title="Smart Budgeting in KES"
              content="Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. This helps maintain a balanced financial lifestyle with your Kenyan Shilling budget."
            />
            <TipCard
              title="Track Daily M-Pesa Expenses"
              content="Recording your M-Pesa transactions daily helps you stay aware of spending patterns and makes budgeting more effective."
            />
            <div style={{
              ...cardStyles,
              background: 'linear-gradient(to bottom right, #8B5CF6, #7C3AED)',
              color: 'white',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '0.5rem',
                  borderRadius: '0.5rem'
                }}>
                  <Quote size={20} />
                </div>
                <div>
                  <h4 style={{ fontWeight: '600', margin: '0 0 0.5rem 0' }}>Daily Motivation</h4>
                  <p style={{ fontSize: '0.875rem', margin: 0, opacity: 0.9, fontStyle: 'italic' }}>
                    "A budget is telling your money where to go instead of wondering where it went." - Dave Ramsey
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;