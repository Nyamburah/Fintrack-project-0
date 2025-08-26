import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, ArrowLeft,
  DollarSign, Coins, Shield, Zap, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import authService from '../services/authService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mpesaNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState([]);
  const [focusedField, setFocusedField] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    
    // Generate floating coins
    const coins = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: Math.random() * 90,
      y: Math.random() * 90,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 3,
      size: 12 + Math.random() * 18,
      color: ['#22c55e', '#10b981', '#14b8a6', '#84cc16', '#eab308'][Math.floor(Math.random() * 5)]
    }));
    setFloatingCoins(coins);

    // Add keyframes for animations
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes bounceFloat {
        0%, 20%, 53%, 80%, 100% { transform: translateY(0) rotate(0deg); }
        40%, 43% { transform: translateY(-20px) rotate(180deg); }
        70% { transform: translateY(-10px) rotate(90deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.05); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes strengthPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      @keyframes strengthGlow {
        0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); }
        50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3); }
      }
      @keyframes checkmarkBounce {
        0% { transform: scale(0) rotate(0deg); }
        50% { transform: scale(1.2) rotate(180deg); }
        100% { transform: scale(1) rotate(360deg); }
      }
      @keyframes progressFill {
        from { width: 0%; }
        to { width: var(--target-width); }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error when user makes changes
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: ''
      }));
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    return errors;
  };

  const validateMpesaNumber = (number) => {
    const kenyaPhoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    return kenyaPhoneRegex.test(number.replace(/\s/g, ''));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (!formData.mpesaNumber) {
      newErrors.mpesaNumber = 'Mpesa number is required';
    } else if (!validateMpesaNumber(formData.mpesaNumber)) {
      newErrors.mpesaNumber = 'Invalid Kenyan phone number (e.g., 0712345678)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = 'Password must have: ' + passwordErrors.join(', ');
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous general errors
    setErrors(prev => ({ ...prev, general: '' }));

    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // Use the auth service for registration
      const result = await authService.register({
        name: formData.name,
        email: formData.email,
        mpesaNumber: formData.mpesaNumber,
        password: formData.password
      });

      if (result.success) {
        // Registration successful
        toast.success(result.message || "Account created successfully!");
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          mpesaNumber: '',
          password: '',
          confirmPassword: '',
        });
        
        // Navigate to login page after short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please log in with your credentials.' 
            }
          });
        }, 1500);
      } else {
        // Registration failed
        setErrors({ general: result.error });
        toast.error(result.error);
        
        // Handle specific error cases
        if (result.status === 409) {
          // User already exists
          setErrors({ 
            email: 'An account with this email already exists',
            general: result.error 
          });
        }
      }
      
    } catch (error) {
      console.error('Unexpected registration error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const getStrengthColor = (strength) => {
    if (strength <= 1) return '#ef4444';
    if (strength === 2) return '#f59e0b';
    if (strength === 3) return '#eab308';
    if (strength >= 4) return '#22c55e';
    return '#d1d5db';
  };

  const getStrengthText = (strength) => {
    if (strength <= 1) return 'Very Weak 😰';
    if (strength === 2) return 'Weak 😕';
    if (strength === 3) return 'Good 😊';
    if (strength >= 4) return 'Strong 💪';
    return '';
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 20%, #047857 40%, #059669 60%, #10b981 80%, #34d399 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
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
      opacity: 0.3,
      animation: 'bounceFloat 4s infinite'
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
      top: '-150px',
      right: '-150px',
      width: '400px',
      height: '400px',
      background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.2))',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 8s infinite'
    },
    bgCircle2: {
      position: 'absolute',
      bottom: '-100px',
      left: '-100px',
      width: '300px',
      height: '300px',
      background: 'radial-gradient(circle, rgba(132, 204, 22, 0.4), rgba(34, 197, 94, 0.2))',
      borderRadius: '50%',
      filter: 'blur(50px)',
      animation: 'pulse 8s infinite 2s'
    },
    bgCircle3: {
      position: 'absolute',
      top: '30%',
      left: '10%',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle, rgba(52, 211, 153, 0.3), rgba(16, 185, 129, 0.1))',
      borderRadius: '50%',
      filter: 'blur(40px)',
      animation: 'pulse 8s infinite 4s'
    },
    formWrapper: {
      maxWidth: '480px',
      width: '100%',
      position: 'relative',
      zIndex: 10,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
      transition: 'all 1s ease'
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
      padding: '24px',
      borderRadius: '24px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
      transform: 'scale(1)',
      transition: 'all 0.4s ease',
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
      background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.4) 50%, transparent 70%)',
      animation: 'shimmer 4s infinite'
    },
    billStack: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    bill: {
      width: '40px',
      height: '24px',
      borderRadius: '4px',
      position: 'absolute',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)'
    },
    bill1: {
      background: 'linear-gradient(45deg, #22c55e, #16a34a)',
      transform: 'rotate(18deg)',
      opacity: 0.8
    },
    bill2: {
      background: 'linear-gradient(45deg, #10b981, #059669)',
      transform: 'rotate(9deg)',
      opacity: 0.9
    },
    bill3: {
      background: 'linear-gradient(45deg, #84cc16, #65a30d)',
      position: 'relative',
      zIndex: 10
    },
    title: {
      fontSize: '52px',
      fontWeight: '900',
      background: 'linear-gradient(135deg, #ffffff, #f0fdf4, #ecfdf5)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '8px',
      textShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
      lineHeight: '1.1'
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '20px',
      fontWeight: '600'
    },
    formCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      borderRadius: '28px',
      padding: '48px',
      boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      border: '3px solid rgba(255, 255, 255, 0.2)',
      animation: 'slideInUp 1s ease 0.3s both'
    },
    errorAlert: {
      background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
      border: '2px solid #f87171',
      borderRadius: '18px',
      padding: '18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '28px',
      boxShadow: '0 10px 20px rgba(248, 113, 113, 0.3)',
      animation: 'slideInUp 0.5s ease'
    },
    inputGroup: {
      marginBottom: '28px'
    },
    label: {
      display: 'block',
      fontSize: '15px',
      fontWeight: '700',
      color: '#065f46',
      marginBottom: '10px',
      transition: 'all 0.3s ease'
    },
    labelFocused: {
      color: '#059669',
      transform: 'translateX(4px)'
    },
    inputWrapper: {
      position: 'relative'
    },
    input: {
      appearance: 'none',
      width: '100%',
      padding: '18px 18px 18px 52px',
      border: '2px solid #d1d5db',
      borderRadius: '16px',
      fontSize: '16px',
      transition: 'all 0.4s ease',
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#111827',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
    },
    inputFocused: {
      borderColor: '#10b981',
      boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.15), 0 8px 16px rgba(16, 185, 129, 0.1)',
      background: '#ffffff',
      transform: 'translateY(-2px)'
    },
    inputError: {
      borderColor: '#ef4444',
      boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.15)'
    },
    inputIcon: {
      position: 'absolute',
      left: '18px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      pointerEvents: 'none',
      transition: 'all 0.3s ease'
    },
    inputIconFocused: {
      color: '#059669'
    },
    eyeButton: {
      position: 'absolute',
      right: '18px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      padding: '6px',
      borderRadius: '8px',
      transition: 'all 0.3s ease'
    },
    eyeButtonHover: {
      color: '#059669',
      background: 'rgba(16, 185, 129, 0.1)'
    },
    errorText: {
      color: '#dc2626',
      fontSize: '13px',
      fontWeight: '600',
      marginTop: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    passwordStrengthContainer: {
      marginTop: '16px',
      padding: '20px',
      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
      borderRadius: '16px',
      border: '2px solid #bbf7d0',
      transition: 'all 0.5s ease',
      animation: formData.password ? 'strengthPulse 2s ease-in-out infinite' : 'none'
    },
    passwordStrengthHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    },
    strengthTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#065f46',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    strengthIndicator: {
      fontSize: '13px',
      fontWeight: '700',
      color: getStrengthColor(passwordStrength),
      transition: 'all 0.3s ease'
    },
    strengthBars: {
      display: 'flex',
      gap: '4px',
      marginBottom: '16px'
    },
    strengthBar: {
      height: '6px',
      flex: 1,
      borderRadius: '3px',
      background: '#e5e7eb',
      transition: 'all 0.4s ease',
      overflow: 'hidden'
    },
    strengthBarFill: (index) => ({
      height: '100%',
      background: passwordStrength > index ? 
        `linear-gradient(90deg, ${getStrengthColor(passwordStrength)}, ${getStrengthColor(passwordStrength)}dd)` : 
        '#e5e7eb',
      borderRadius: '3px',
      transition: 'all 0.5s ease',
      animation: passwordStrength > index ? 'progressFill 0.6s ease' : 'none',
      boxShadow: passwordStrength > index ? `0 0 8px ${getStrengthColor(passwordStrength)}40` : 'none'
    }),
    requirementsList: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    },
    requirement: (met) => ({
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: met ? '#059669' : '#6b7280',
      transition: 'all 0.3s ease',
      fontWeight: met ? '600' : '500'
    }),
    requirementIcon: (met) => ({
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: met ? '#22c55e' : '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.4s ease',
      animation: met ? 'checkmarkBounce 0.6s ease' : 'none'
    }),
    submitButton: {
      width: '100%',
      padding: '20px',
      background: 'linear-gradient(135deg, #059669, #10b981, #14b8a6)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      fontSize: '18px',
      fontWeight: '800',
      cursor: 'pointer',
      transition: 'all 0.4s ease',
      boxShadow: '0 10px 20px rgba(5, 150, 105, 0.4)',
      position: 'relative',
      overflow: 'hidden'
    },
    submitButtonHover: {
      background: 'linear-gradient(135deg, #047857, #059669, #0f766e)',
      transform: 'translateY(-3px)',
      boxShadow: '0 15px 30px rgba(5, 150, 105, 0.5)'
    },
    submitButtonDisabled: {
      background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: '0 4px 8px rgba(156, 163, 175, 0.2)'
    },
    loadingSpinner: {
      width: '24px',
      height: '24px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderTop: '3px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    linkSection: {
      textAlign: 'center',
      marginTop: '28px'
    },
    link: {
      color: '#059669',
      textDecoration: 'none',
      fontWeight: '700',
      fontSize: '15px',
      transition: 'all 0.3s ease'
    },
    linkHover: {
      color: '#047857',
      textDecoration: 'underline'
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      color: 'rgba(255, 255, 255, 0.9)',
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: '600',
      marginTop: '28px',
      transition: 'all 0.3s ease'
    },
    backLinkHover: {
      color: 'white',
      transform: 'translateX(-4px)'
    }
  };

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
        <div style={styles.bgCircle3}></div>
      </div>

      {/* Main Form */}
      <div style={styles.formWrapper}>
        {/* Header */}
        <div style={styles.headerSection}>
          <div style={styles.logoContainer}>
            <div 
              style={styles.logo}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.15) rotate(10deg)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1) rotate(0deg)'}
            >
              <div style={styles.logoShine}></div>
              <div style={styles.billStack}>
                <div style={{...styles.bill, ...styles.bill1}}></div>
                <div style={{...styles.bill, ...styles.bill2}}></div>
                <div style={{...styles.bill, ...styles.bill3}}></div>
                <DollarSign size={18} color="white" style={{ position: 'relative', zIndex: 20 }} />
              </div>
            </div>
          </div>
          <h1 style={styles.title}>Join The Game! 🚀</h1>
          <p style={styles.subtitle}>Your financial freedom journey starts here</p>
        </div>

        {/* Form Card */}
        <div style={styles.formCard}>
          <form onSubmit={handleSubmit}>
            {/* General Error Message */}
            {errors.general && (
              <div style={styles.errorAlert}>
                <AlertCircle size={22} color="#dc2626" />
                <span style={{ color: '#dc2626', fontSize: '15px', fontWeight: '700' }}>{errors.general}</span>
              </div>
            )}

            {/* Full Name */}
            <div style={styles.inputGroup}>
              <label 
                htmlFor="name" 
                style={{
                  ...styles.label,
                  ...(focusedField === 'name' ? styles.labelFocused : {})
                }}
              >
                Full Name
              </label>
              <div style={styles.inputWrapper}>
                <User 
                  size={20} 
                  style={{
                    ...styles.inputIcon,
                    ...(focusedField === 'name' ? styles.inputIconFocused : {})
                  }} 
                />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  style={{
                    ...styles.input,
                    ...(focusedField === 'name' ? styles.inputFocused : {}),
                    ...(errors.name ? styles.inputError : {})
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <div style={styles.errorText}>
                  <AlertCircle size={14} />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div style={styles.inputGroup}>
              <label 
                htmlFor="email" 
                style={{
                  ...styles.label,
                  ...(focusedField === 'email' ? styles.labelFocused : {})
                }}
              >
                Email Address
              </label>
              <div style={styles.inputWrapper}>
                <Mail 
                  size={20} 
                  style={{
                    ...styles.inputIcon,
                    ...(focusedField === 'email' ? styles.inputIconFocused : {})
                  }} 
                />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  style={{
                    ...styles.input,
                    ...(focusedField === 'email' ? styles.inputFocused : {}),
                    ...(errors.email ? styles.inputError : {})
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <div style={styles.errorText}>
                  <AlertCircle size={14} />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Mpesa Number */}
            <div style={styles.inputGroup}>
              <label 
                htmlFor="mpesaNumber" 
                style={{
                  ...styles.label,
                  ...(focusedField === 'mpesa' ? styles.labelFocused : {})
                }}
              >
                M-Pesa Number
              </label>
              <div style={styles.inputWrapper}>
                <Phone 
                  size={20} 
                  style={{
                    ...styles.inputIcon,
                    ...(focusedField === 'mpesa' ? styles.inputIconFocused : {})
                  }} 
                />
                <input
                  id="mpesaNumber"
                  type="text"
                  name="mpesaNumber"
                  value={formData.mpesaNumber}
                  onChange={handleInputChange}
                  placeholder="0712345678"
                  style={{
                    ...styles.input,
                    ...(focusedField === 'mpesa' ? styles.inputFocused : {}),
                    ...(errors.mpesaNumber ? styles.inputError : {})
                  }}
                  onFocus={() => setFocusedField('mpesa')}
                  onBlur={() => setFocusedField('')}
                  disabled={isLoading}
                />
              </div>
              {errors.mpesaNumber && (
                <div style={styles.errorText}>
                  <AlertCircle size={14} />
                  {errors.mpesaNumber}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label 
                htmlFor="password" 
                style={{
                  ...styles.label,
                  ...(focusedField === 'password' ? styles.labelFocused : {})
                }}
              >
                Password
              </label>
              <div style={styles.inputWrapper}>
                <Lock 
                  size={20} 
                  style={{
                    ...styles.inputIcon,
                    ...(focusedField === 'password' ? styles.inputIconFocused : {})
                  }} 
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  style={{
                    ...styles.input,
                    paddingRight: '52px',
                    ...(focusedField === 'password' ? styles.inputFocused : {}),
                    ...(errors.password ? styles.inputError : {})
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.eyeButtonHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, { color: '#6b7280', background: 'none' })}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <div style={styles.errorText}>
                  <AlertCircle size={14} />
                  {errors.password}
                </div>
              )}
              
              {/* Animated Password Strength Indicator */}
              {formData.password && (
                <div style={{
                  ...styles.passwordStrengthContainer,
                  ...(passwordStrength >= 4 ? { animation: 'strengthGlow 2s ease-in-out infinite' } : {})
                }}>
                  <div style={styles.passwordStrengthHeader}>
                    <div style={styles.strengthTitle}>
                      <Shield size={16} />
                      Password Strength
                    </div>
                    <div style={styles.strengthIndicator}>
                      {getStrengthText(passwordStrength)}
                    </div>
                  </div>
                  
                  <div style={styles.strengthBars}>
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} style={styles.strengthBar}>
                        <div style={styles.strengthBarFill(index)}></div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={styles.requirementsList}>
                    <div style={styles.requirement(formData.password.length >= 8)}>
                      <div style={styles.requirementIcon(formData.password.length >= 8)}>
                        {formData.password.length >= 8 ? (
                          <CheckCircle size={10} color="white" />
                        ) : (
                          <div style={{ width: '6px', height: '6px', background: '#9ca3af', borderRadius: '50%' }}></div>
                        )}
                      </div>
                      8+ characters
                    </div>
                    <div style={styles.requirement(/[A-Z]/.test(formData.password))}>
                      <div style={styles.requirementIcon(/[A-Z]/.test(formData.password))}>
                        {/[A-Z]/.test(formData.password) ? (
                          <CheckCircle size={10} color="white" />
                        ) : (
                          <div style={{ width: '6px', height: '6px', background: '#9ca3af', borderRadius: '50%' }}></div>
                        )}
                      </div>
                      Uppercase
                    </div>
                    <div style={styles.requirement(/[a-z]/.test(formData.password))}>
                      <div style={styles.requirementIcon(/[a-z]/.test(formData.password))}>
                        {/[a-z]/.test(formData.password) ? (
                          <CheckCircle size={10} color="white" />
                        ) : (
                          <div style={{ width: '6px', height: '6px', background: '#9ca3af', borderRadius: '50%' }}></div>
                        )}
                      </div>
                      Lowercase
                    </div>
                    <div style={styles.requirement(/\d/.test(formData.password))}>
                      <div style={styles.requirementIcon(/\d/.test(formData.password))}>
                        {/\d/.test(formData.password) ? (
                          <CheckCircle size={10} color="white" />
                        ) : (
                          <div style={{ width: '6px', height: '6px', background: '#9ca3af', borderRadius: '50%' }}></div>
                        )}
                      </div>
                      Number
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={styles.inputGroup}>
              <label 
                htmlFor="confirmPassword" 
                style={{
                  ...styles.label,
                  ...(focusedField === 'confirmPassword' ? styles.labelFocused : {})
                }}
              >
                Confirm Password
              </label>
              <div style={styles.inputWrapper}>
                <Lock 
                  size={20} 
                  style={{
                    ...styles.inputIcon,
                    ...(focusedField === 'confirmPassword' ? styles.inputIconFocused : {})
                  }} 
                />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  style={{
                    ...styles.input,
                    paddingRight: '52px',
                    ...(focusedField === 'confirmPassword' ? styles.inputFocused : {}),
                    ...(errors.confirmPassword ? styles.inputError : {}),
                    ...(formData.confirmPassword && formData.password === formData.confirmPassword ? 
                      { borderColor: '#22c55e', boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.15)' } : {})
                  }}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  disabled={isLoading}
                />
                <div style={{ position: 'absolute', right: '52px', top: '50%', transform: 'translateY(-50%)' }}>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle size={20} color="#22c55e" style={{ animation: 'checkmarkBounce 0.6s ease' }} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  onMouseEnter={(e) => Object.assign(e.target.style, styles.eyeButtonHover)}
                  onMouseLeave={(e) => Object.assign(e.target.style, { color: '#6b7280', background: 'none' })}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div style={styles.errorText}>
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || passwordStrength < 3}
              style={{
                ...styles.submitButton,
                ...(isLoading || passwordStrength < 3 ? styles.submitButtonDisabled : {})
              }}
              onMouseEnter={(e) => {
                if (!isLoading && passwordStrength >= 3) {
                  Object.assign(e.target.style, styles.submitButtonHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && passwordStrength >= 3) {
                  Object.assign(e.target.style, {
                    background: 'linear-gradient(135deg, #059669, #10b981, #14b8a6)',
                    transform: 'translateY(0px)',
                    boxShadow: '0 10px 20px rgba(5, 150, 105, 0.4)'
                  });
                }
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={styles.loadingSpinner}></div>
                  <span>Creating Your Account...</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Zap size={20} />
                  <span>Start My Money Journey!</span>
                  <Target size={20} />
                </div>
              )}
            </button>

            {/* Password Requirements Info */}
            {!formData.password && (
              <div style={{
                marginTop: '20px',
                padding: '18px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                borderRadius: '14px',
                border: '2px solid #e2e8f0'
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#475569', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Shield size={16} />
                  Password Requirements:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%' }}></div>
                    At least 8 characters
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%' }}></div>
                    One uppercase letter
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%' }}></div>
                    One lowercase letter
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '4px', height: '4px', background: '#94a3b8', borderRadius: '50%' }}></div>
                    One number
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Links */}
          <div style={styles.linkSection}>
            <p style={{ color: '#6b7280', fontSize: '15px', margin: '0 0 8px 0', fontWeight: '500' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={styles.link}
                onMouseEnter={(e) => Object.assign(e.target.style, styles.linkHover)}
                onMouseLeave={(e) => Object.assign(e.target.style, { color: '#059669', textDecoration: 'none' })}
              >
                Sign in here! 💚
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center' }}>
          <Link 
            to="/" 
            style={styles.backLink}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.backLinkHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, { color: 'rgba(255, 255, 255, 0.9)', transform: 'translateX(0px)' })}
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;