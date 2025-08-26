import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import { 
  Wallet, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  AlertCircle, 
  DollarSign,
  Coins,
  ArrowLeft
} from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState([]);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    
    // Generate floating coins
    const coins = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 90,
      y: Math.random() * 90,
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 3,
      size: 15 + Math.random() * 20,
      color: ['#22c55e', '#10b981', '#14b8a6', '#84cc16', '#eab308'][Math.floor(Math.random() * 5)]
    }));
    setFloatingCoins(coins);

    // Add keyframes for animations
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes bounceFloat {
        0%, 20%, 53%, 80%, 100% { transform: translateY(0) rotate(0deg); }
        40%, 43% { transform: translateY(-15px) rotate(180deg); }
        70% { transform: translateY(-8px) rotate(90deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.05); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { email, password } = formData;

    // Basic validation
    if (!email?.trim() || !password?.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting login process...');
      console.log('Email:', email);
      
      const result = await authService.login(email.trim(), password);
      console.log('Login result:', result);

      if (result && (result.success === true || result.token)) {
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        
        if (login && typeof login === 'function') {
          try {
            await login(result.user || { email }, result.token);
          } catch (authError) {
            console.error('Auth context login error:', authError);
          }
        }
        
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard');
      } else {
        const errorMessage = result?.error || result?.message || 'Login failed. Please try again.';
        setError(errorMessage);
        console.error('Login failed:', errorMessage);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        console.error('Server error response:', { status, data });
        
        switch (status) {
          case 401:
            setError('Invalid email or password. Please check your credentials and try again.');
            break;
          case 400:
            setError(data?.message || 'Invalid request. Please check your input.');
            break;
          case 404:
            setError('Login service not found. Please contact support.');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError(data?.message || 'Login failed. Please try again.');
        }
      } else if (err.request) {
        console.error('Network error:', err.request);
        setError('Network error. Please check your internet connection and try again.');
      } else {
        console.error('Unexpected error:', err.message);
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #047857 50%, #059669 75%, #10b981 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px'
    },
    floatingCoinsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 1
    },
    floatingCoin: {
      position: 'absolute',
      opacity: 0.4,
      animation: 'bounceFloat 3s infinite'
    },
    backgroundElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0
    },
    bgCircle1: {
      position: 'absolute',
      top: '-100px',
      right: '-100px',
      width: '300px',
      height: '300px',
      background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2))',
      borderRadius: '50%',
      filter: 'blur(40px)',
      animation: 'pulse 6s infinite'
    },
    bgCircle2: {
      position: 'absolute',
      bottom: '-120px',
      left: '-120px',
      width: '250px',
      height: '250px',
      background: 'radial-gradient(circle, rgba(132, 204, 22, 0.3), rgba(34, 197, 94, 0.2))',
      borderRadius: '50%',
      filter: 'blur(40px)',
      animation: 'pulse 6s infinite 2s'
    },
    formWrapper: {
      maxWidth: '420px',
      width: '100%',
      position: 'relative',
      zIndex: 10,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.8s ease'
    },
    headerSection: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    logoContainer: {
      display: 'inline-block',
      marginBottom: '24px'
    },
    logo: {
      background: 'linear-gradient(135deg, #059669, #10b981, #14b8a6)',
      padding: '20px',
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
      transform: 'scale(1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer'
    },
    logoShine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)',
      animation: 'shimmer 3s infinite'
    },
    billStack: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    bill: {
      width: '36px',
      height: '22px',
      borderRadius: '3px',
      position: 'absolute',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    },
    bill1: {
      background: 'linear-gradient(45deg, #22c55e, #16a34a)',
      transform: 'rotate(15deg)',
      opacity: 0.8
    },
    bill2: {
      background: 'linear-gradient(45deg, #10b981, #059669)',
      transform: 'rotate(8deg)',
      opacity: 0.9
    },
    bill3: {
      background: 'linear-gradient(45deg, #84cc16, #65a30d)',
      position: 'relative',
      zIndex: 10
    },
    title: {
      fontSize: '48px',
      fontWeight: '900',
      background: 'linear-gradient(135deg, #ffffff, #f0fdf4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '8px',
      textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '18px',
      fontWeight: '600'
    },
    formCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '40px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      animation: 'slideInUp 0.8s ease 0.3s both'
    },
    errorAlert: {
      background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
      border: '2px solid #f87171',
      borderRadius: '16px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px',
      boxShadow: '0 8px 16px rgba(248, 113, 113, 0.2)'
    },
    inputGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '700',
      color: '#065f46',
      marginBottom: '8px'
    },
    inputWrapper: {
      position: 'relative'
    },
    input: {
      appearance: 'none',
      width: '100%',
      padding: '16px 16px 16px 48px',
      border: '2px solid #d1d5db',
      borderRadius: '12px',
      fontSize: '16px',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#111827'
    },
    inputFocused: {
      borderColor: '#10b981',
      boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)',
      background: '#ffffff'
    },
    inputIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      pointerEvents: 'none'
    },
    eyeButton: {
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    submitButton: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, #059669, #10b981, #14b8a6)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 16px rgba(5, 150, 105, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    submitButtonHover: {
      background: 'linear-gradient(135deg, #047857, #059669, #0f766e)',
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 24px rgba(5, 150, 105, 0.4)'
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    linkSection: {
      textAlign: 'center',
      marginTop: '24px'
    },
    link: {
      color: '#059669',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.2s ease'
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: 'rgba(255, 255, 255, 0.8)',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '600',
      marginTop: '24px',
      transition: 'all 0.2s ease'
    }
  };

  // Add spin animation for loading spinner
  useEffect(() => {
    const spinKeyframes = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = spinKeyframes;
    document.head.appendChild(styleSheet);
    
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Floating Coins Animation */}
      <div style={styles.floatingCoinsContainer}>
        {floatingCoins.map((coin) => (
          <div
            key={coin.id}
            style={{
              ...styles.floatingCoin,
              left: `${coin.x}%`,
              top: `${coin.y}%`,
              animationDelay: `${coin.delay}s`,
              animationDuration: `${coin.duration}s`,
              color: coin.color
            }}
          >
            <Coins size={coin.size} />
          </div>
        ))}
      </div>

      {/* Background Elements */}
      <div style={styles.backgroundElements}>
        <div style={styles.bgCircle1}></div>
        <div style={styles.bgCircle2}></div>
      </div>

      {/* Main Form */}
      <div style={styles.formWrapper}>
        {/* Header */}
        <div style={styles.headerSection}>
          <div style={styles.logoContainer}>
            <div 
              style={styles.logo}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1) rotate(5deg)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1) rotate(0deg)'}
            >
              <div style={styles.logoShine}></div>
              <div style={styles.billStack}>
                <div style={{...styles.bill, ...styles.bill1}}></div>
                <div style={{...styles.bill, ...styles.bill2}}></div>
                <div style={{...styles.bill, ...styles.bill3}}></div>
                <DollarSign size={16} color="white" style={{ position: 'relative', zIndex: 20 }} />
              </div>
            </div>
          </div>
          <h1 style={styles.title}>Welcome Back! 💚</h1>
          <p style={styles.subtitle}>Ready to master your money game?</p>
        </div>

        {/* Form Card */}
        <div style={styles.formCard}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={styles.errorAlert}>
                <AlertCircle size={20} color="#dc2626" />
                <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={20} style={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocused)}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={20} style={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  style={{ ...styles.input, paddingRight: '48px' }}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocused)}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  onMouseEnter={(e) => e.target.style.color = '#059669'}
                  onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={styles.submitButton}
              onMouseEnter={(e) => !isLoading && Object.assign(e.target.style, styles.submitButtonHover)}
              onMouseLeave={(e) => !isLoading && Object.assign(e.target.style, {
                background: 'linear-gradient(135deg, #059669, #10b981, #14b8a6)',
                transform: 'translateY(0px)',
                boxShadow: '0 8px 16px rgba(5, 150, 105, 0.3)'
              })}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={styles.loadingSpinner}></div>
                  <span>Signing you in...</span>
                </div>
              ) : (
                'Sign In & Stack! 🎯'
              )}
            </button>
          </form>

          {/* Links */}
          <div style={styles.linkSection}>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={styles.link}
                onMouseEnter={(e) => e.target.style.color = '#047857'}
                onMouseLeave={(e) => e.target.style.color = '#059669'}
              >
                Join the money game! 🚀
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center' }}>
          <Link 
            to="/" 
            style={styles.backLink}
            onMouseEnter={(e) => e.target.style.color = 'white'}
            onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;