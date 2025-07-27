/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
//import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import {
  Home,
  CreditCard,
  Tag,
  Target,
  BarChart3,
  Wallet,
  Lightbulb,
  Menu,
  X,
  LogOut,
  Coins,
  Flame
} from 'lucide-react';

/**
 * Navigation Bar Component
 * 
 * This component provides navigation throughout the application.
 * It includes user information, navigation links, and logout functionality.
 * The navbar is responsive and includes a mobile menu.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation items with their routes and icons
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/categories', label: 'Categories', icon: Tag },
    { path: '/budgets', label: 'Budgets', icon: Target },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/payment', label: 'Payment', icon: Wallet },
    { path: '/tips', label: 'Tips', icon: Lightbulb }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FinWallet</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(({ path, label, icon: IconComponent }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* User Stats - Desktop */}
            {user && (
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-md">
                  <Flame className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-700 font-medium">{user.streak}</span>
                </div>
                <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-md">
                  <Coins className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-700 font-medium">{user.coins}</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">{user.points}</span> pts
                </div>
              </div>
            )}

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-gray-700">Hi, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {/* User Stats - Mobile */}
              {user && (
                <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">Hi, {user.name}</span>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-1">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-700">{user.streak}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-700">{user.coins}</span>
                    </div>
                    <span className="text-gray-600">{user.points} pts</span>
                  </div>
                </div>
              )}

              {/* Navigation Links - Mobile */}
              {navItems.map(({ path, label, icon: IconComponent }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}

              {/* Logout - Mobile */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;