import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wallet, 
  Shield, 
  Flame, 
  Coins, 
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Info,
  Star
} from 'lucide-react';

/**
 * Payment Page Component
 * 
 * This page handles the weekly commitment fee system and streak recovery.
 * Users can pay their weekly commitment fee and use coins to save their streak.
 * 
 * Features:
 * - Weekly commitment fee payment (7 shillings)
 * - Streak recovery using coins (10 coins)
 * - Payment status tracking
 * - Mpesa integration for payments
 * - Streak motivation and rewards explanation
 * 
 * DATABASE INTEGRATION POINTS:
 * - Payment history should be stored in 'payments' table
 * - User streak and coin balance updates
 * - Weekly payment status tracking
 * - Integration with Mpesa API for payment processing
 */
const PaymentPage = () => {
  const { user, updateUserStats } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showStreakRecovery, setShowStreakRecovery] = useState(false);

  // Calculate days until next payment
  const getDaysUntilNextPayment = () => {
    // Mock calculation - in real app, this would be based on last payment date
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    return 7 - today; // Days until next Sunday
  };

  const daysUntilPayment = getDaysUntilNextPayment();

  /**
   * Handle Weekly Payment
   * 
   * DATABASE INTEGRATION POINT:
   * This should process payment through Mpesa API and update user's payment status
   * 
   * Expected API endpoints:
   * - POST /api/payments/weekly - Process weekly commitment fee
   * - PUT /api/users/payment-status - Update user payment status
   */
  const handleWeeklyPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // TODO: Integrate with Mpesa API
      // const response = await fetch('/api/payments/weekly', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     amount: 7,
      //     phone: user?.mpesaNumber,
      //     description: 'Weekly commitment fee'
      //   })
      // });
      
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful payment
      setPaymentStatus('success');
      
      // Update user payment status
      // TODO: Update in database
      console.log('Payment successful - update user payment status');
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  /**
   * Handle Streak Recovery
   * 
   * DATABASE INTEGRATION POINT:
   * This should deduct coins from user balance and restore their streak
   * 
   * Expected API endpoint:
   * - POST /api/users/recover-streak - Use coins to recover streak
   */
  const handleStreakRecovery = () => {
    if (!user || user.coins < 10) {
      return;
    }

    // Deduct 10 coins and restore streak
    const newCoins = user.coins - 10;
    const restoredStreak = user.streak > 0 ? user.streak : 1;
    
    updateUserStats(restoredStreak, newCoins, user.points);
    setShowStreakRecovery(false);
    
    // TODO: Update in database
    // fetch('/api/users/recover-streak', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId: user.id })
    // });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Center</h1>
          <p className="text-gray-600 mt-2">
            Manage your weekly commitment and streak recovery
          </p>
        </div>

        {/* User Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Current Streak</p>
                <p className="text-3xl font-bold">{user?.streak || 0}</p>
                <p className="text-orange-100 text-xs">days</p>
              </div>
              <Flame className="h-8 w-8" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Available Coins</p>
                <p className="text-3xl font-bold">{user?.coins || 0}</p>
                <p className="text-yellow-100 text-xs">total</p>
              </div>
              <Coins className="h-8 w-8" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Payment Status</p>
                <p className="text-lg font-bold">
                  {user?.weeklyPaymentStatus ? 'Paid' : 'Pending'}
                </p>
                <p className="text-emerald-100 text-xs">this week</p>
              </div>
              <Shield className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Main Payment Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Commitment Fee */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Weekly Commitment Fee</h2>
              <p className="text-gray-600 mt-2">
                Stay committed to your financial goals with our weekly accountability system
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Weekly Fee</span>
                  <span className="font-semibold text-gray-900">₹7.00</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="font-semibold text-gray-900">Mpesa</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Next Payment</span>
                  <span className="font-semibold text-gray-900">
                    {daysUntilPayment === 0 ? 'Today' : `${daysUntilPayment} days`}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              {paymentStatus === 'success' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-emerald-800 font-medium">Payment Successful!</p>
                    <p className="text-emerald-700 text-sm">Your weekly commitment is secured.</p>
                  </div>
                </div>
              )}

              {paymentStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-red-800 font-medium">Payment Failed</p>
                    <p className="text-red-700 text-sm">Please try again or contact support.</p>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handleWeeklyPayment}
                disabled={isProcessingPayment || user?.weeklyPaymentStatus}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  user?.weeklyPaymentStatus
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isProcessingPayment
                    ? 'bg-emerald-400 text-white cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : user?.weeklyPaymentStatus ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Payment Complete</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Pay ₹7 via Mpesa</span>
                  </>
                )}
              </button>

              {/* Payment Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-blue-900 font-medium text-sm">How it works</h4>
                    <p className="text-blue-800 text-sm mt-1">
                      Pay ₹7 weekly to stay committed. If you break your streak, you lose the fee. 
                      Maintain your streak to keep your money safe and earn rewards!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Recovery */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="h-8 w-8 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Streak Recovery</h2>
              <p className="text-gray-600 mt-2">
                Use your earned coins to save a broken streak
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Recovery Cost</span>
                  <span className="font-semibold text-gray-900">10 Coins</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Your Coins</span>
                  <span className="font-semibold text-gray-900">{user?.coins || 0} Coins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Streak</span>
                  <span className="font-semibold text-gray-900">{user?.streak || 0} days</span>
                </div>
              </div>

              {/* Streak Recovery Options */}
              {user?.streak === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-yellow-800 font-medium">Streak Broken!</p>
                      <p className="text-yellow-700 text-sm">
                        You can use 10 coins to recover your streak and continue your journey.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-emerald-800 font-medium">Streak Active!</p>
                      <p className="text-emerald-700 text-sm">
                        Keep up the great work! Recovery is available if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery Button */}
              <button
                onClick={() => setShowStreakRecovery(true)}
                disabled={(user?.coins || 0) < 10}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  (user?.coins || 0) < 10
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <Coins className="h-4 w-4" />
                <span>
                  {(user?.coins || 0) < 10 ? 'Not Enough Coins' : 'Recover Streak (10 Coins)'}
                </span>
              </button>

              {/* Coin Earning Info */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="text-purple-900 font-medium text-sm">Earn More Coins</h4>
                    <ul className="text-purple-800 text-sm mt-1 space-y-1">
                      <li>• 1 coin per day for maintaining streak</li>
                      <li>• 50 bonus points for completing a full week</li>
                      <li>• Label transactions daily to earn rewards</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streak Recovery Confirmation Modal */}
        {showStreakRecovery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="text-center mb-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Recover Your Streak</h2>
                <p className="text-gray-600 mt-2">
                  Are you sure you want to use 10 coins to recover your streak?
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Current Coins</span>
                  <span className="font-semibold text-gray-900">{user?.coins || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Recovery Cost</span>
                  <span className="font-semibold text-red-600">-10</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Remaining Coins</span>
                    <span className="font-bold text-gray-900">{(user?.coins || 0) - 10}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleStreakRecovery}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium"
                >
                  Confirm Recovery
                </button>
                <button
                  onClick={() => setShowStreakRecovery(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">How the Commitment System Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Pay Weekly Fee</h3>
              <p className="text-sm text-gray-600">
                Pay ₹7 every week to show your commitment to financial tracking
              </p>
            </div>

            <div className="text-center">
              <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-emerald-600">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Maintain Streak</h3>
              <p className="text-sm text-gray-600">
                Label your transactions daily to maintain your streak and earn coins
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Earn Rewards</h3>
              <p className="text-sm text-gray-600">
                Get 1 coin daily and 50 bonus points for completing full weeks
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">4</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Stay Protected</h3>
              <p className="text-sm text-gray-600">
                Use coins to recover broken streaks or lose your weekly fee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;