import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Target, 
  BarChart3, 
  Smartphone, 
  Shield, 
  Coins,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

/**
 * Landing Page Component
 * 
 * This is the first page users see when they visit the application.
 * It showcases the app's features and encourages user registration.
 * 
 * Features highlighted:
 * - Mpesa transaction tracking
 * - Budget management
 * - Streak system with rewards
 * - Financial insights
 */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <img src="./images/fintrack-logo.jpg" alt="FinTrack Logo" className="w-12 h-12 bouncy" />

              </div>
              <span className="text-xl font-bold text-gray-900">FinTrack</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-emerald-600 font-medium transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Master Your <span className="text-emerald-600">Financial Future</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Own the game by tracking your transactions everyday!
    
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Smartphone className="h-5 w-5" />
              <span>Start Tracking Now</span>
            </Link>
          </div>
        </div>
      </section>    
     
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <img src="./images/fintrack-logo.jpg" alt="FinTrack Logo" className="w-12 h-12 bouncy" />

              </div>
              <span className="text-xl font-bold">FinTrack</span>
            </div>
            
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2024. FinTrack All rights reserved.</p>
              <p className="text-sm mt-1">
                Empowering financial freedom through smart tracking
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;