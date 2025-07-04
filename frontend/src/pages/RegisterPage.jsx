import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
  const navigate = useNavigate();

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
      console.log('Validation errors:', errors); // Debug: log errors if validation fails
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Attempting to register with:', {
        name: formData.name.trim(),
        email: formData.email.toLowerCase(),
        mpesaNumber: formData.mpesaNumber,
        password: '***hidden***'
      });

      const response = await axios.post('http://localhost:8000/auth/register', {
        name: formData.name.trim(),
        email: formData.email.toLowerCase(),
        mpesaNumber: formData.mpesaNumber,
        password: formData.password
      });

      console.log('Registration response:', response.data);

      // Check if registration was successful
      if (response.data.success || response.data.user) {
        toast.success("Account created successfully!");
        // Clear form
        setFormData({
          name: '',
          email: '',
          mpesaNumber: '',
          password: '',
          confirmPassword: '',
        });
        // Navigate to login page after successful registration
        navigate('/login');
      } else if (response.data.error) {
        // Handle backend validation errors
        setErrors({ general: response.data.error });
        toast.error(response.data.error);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
        toast.error('Registration failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response) {
        // Server responded with error status
        console.log('Server error response:', error.response.data);
        console.log('Status code:', error.response.status);
        
        if (error.response.data && error.response.data.error) {
          setErrors({ general: error.response.data.error });
          toast.error(error.response.data.error);
        } else {
          setErrors({ general: 'Server error occurred. Please try again.' });
          toast.error('Server error occurred. Please try again.');
        }
      } else if (error.request) {
        // Network error - no response received
        console.log('Network error - no response received');
        setErrors({ general: 'Cannot connect to server. Please check if the server is running.' });
        toast.error('Cannot connect to server. Please check if the server is running.');
      } else {
        // Other error
        console.log('Error setting up request:', error.message);
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-emerald-600 p-3 rounded-xl inline-block">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Join FinWallet</h2>
          <p className="text-gray-600">Start your journey to financial freedom</p>
        </div>

        {/* Registration Form */}
        <form className="bg-white shadow-lg rounded-xl p-8 space-y-6" onSubmit={handleSubmit}>
          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Mpesa Number */}
          <div>
            <label htmlFor="mpesaNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Mpesa Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="mpesaNumber"
                type="text"
                name="mpesaNumber"
                value={formData.mpesaNumber}
                onChange={handleInputChange}
                placeholder="0712345678"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                  errors.mpesaNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.mpesaNumber && <p className="text-red-500 text-sm mt-1">{errors.mpesaNumber}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Password Requirements */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Password must contain:</p>
            <ul className="space-y-1">
              <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                <span className="mr-2">{formData.password.length >= 8 ? '✓' : '•'}</span>
                At least 8 characters
              </li>
              <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                <span className="mr-2">{/[A-Z]/.test(formData.password) ? '✓' : '•'}</span>
                One uppercase letter
              </li>
              <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                <span className="mr-2">{/[a-z]/.test(formData.password) ? '✓' : '•'}</span>
                One lowercase letter
              </li>
              <li className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                <span className="mr-2">{/\d/.test(formData.password) ? '✓' : '•'}</span>
                One number
              </li>
            </ul>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-emerald-600 font-medium hover:underline transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;