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
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FinWallet</span>
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
            Transform your Mpesa transactions into actionable insights. Track spending, 
            build habits, and achieve your financial goals with our intelligent tracking system.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Smartphone className="h-5 w-5" />
              <span>Start Tracking Now</span>
            </Link>
            <Link
              to="/tips"
              className="border-2 border-emerald-600 text-emerald-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-50 transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Smart Money Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to take control of your finances in one beautiful app
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl">
              <div className="bg-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Mpesa Integration
              </h3>
              <p className="text-gray-600">
                Automatically parse and categorize your Mpesa transactions. 
                Never miss a payment or expense again.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Budgeting
              </h3>
              <p className="text-gray-600">
                Set custom budgets for different categories and track your 
                progress with real-time insights.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Detailed Reports
              </h3>
              <p className="text-gray-600">
                Get comprehensive reports on your spending patterns, 
                trends, and financial health.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
              <div className="bg-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Streak Rewards
              </h3>
              <p className="text-gray-600">
                Build consistent habits with our streak system. 
                Earn coins and points for staying committed.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your financial data is encrypted and secure. 
                We never share your personal information.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl">
              <div className="bg-pink-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Financial Growth
              </h3>
              <p className="text-gray-600">
                Get personalized tips and insights to improve 
                your financial health and build wealth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How FinWallet Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connect Your Mpesa
              </h3>
              <p className="text-gray-600">
                Link your phone number to automatically import and parse 
                your Mpesa transaction messages.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Categorize & Budget
              </h3>
              <p className="text-gray-600">
                Label your transactions with custom categories and 
                set budgets to track your spending goals.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Track & Improve
              </h3>
              <p className="text-gray-600">
                Monitor your progress, maintain streaks, and get 
                insights to improve your financial habits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Trusted by Thousands of Users
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="flex items-center justify-center space-x-2">
              <Users className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">5,000+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <BarChart3 className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">₹2M+</div>
                <div className="text-gray-600">Tracked Transactions</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="text-3xl font-bold text-gray-900">4.9/5</div>
                <div className="text-gray-600">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Finances?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of users who have taken control of their financial future
          </p>
          
          <Link
            to="/register"
            className="bg-white text-emerald-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <Wallet className="h-5 w-5" />
            <span>Start Your Journey Today</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">FinWallet</span>
            </div>
            
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2024 FinWallet. All rights reserved.</p>
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