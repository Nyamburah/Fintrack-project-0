import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lightbulb,
  TrendingUp,
  Shield,
  Target,
  PiggyBank,
  CreditCard,
  BarChart3,
  Wallet,
  Star,
  BookOpen
} from 'lucide-react';

/**
 * Financial Tips Page Component
 * 
 * This page provides a slideshow of financial pro tips to educate users
 * about personal finance management, budgeting, and smart money habits.
 * 
 * Features:
 * - Interactive slideshow with 10 financial tips
 * - Beautiful design with icons and illustrations
 * - Navigation controls (previous/next/dots)
 * - Auto-play functionality
 * - Mobile-responsive design
 * - Educational content for financial literacy
 */
const FinancialTipsPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Financial tips data
  const tips = [
    {
      id: 1,
      title: "The 50/30/20 Rule",
      description: "Allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment. This simple rule helps maintain a balanced financial life.",
      icon: PiggyBank,
      color: "from-emerald-500 to-teal-500",
      tips: [
        "Track your income and categorize expenses",
        "Prioritize essential needs first",
        "Be mindful of your wants vs needs",
        "Automate your savings to make it effortless"
      ]
    },
    {
      id: 2,
      title: "Build an Emergency Fund",
      description: "Aim to save 3-6 months of living expenses in an easily accessible account. This fund protects you from unexpected financial setbacks.",
      icon: Shield,
      color: "from-blue-500 to-indigo-500",
      tips: [
        "Start with a goal of ₹1,000 if you're beginning",
        "Save automatically each month",
        "Keep it in a separate high-yield savings account",
        "Only use it for true emergencies"
      ]
    },
    {
      id: 3,
      title: "Track Every Expense",
      description: "Knowledge is power. Understanding where your money goes is the first step to taking control of your finances and making informed decisions.",
      icon: BarChart3,
      color: "from-purple-500 to-pink-500",
      tips: [
        "Use apps like FinWallet to automate tracking",
        "Review your expenses weekly",
        "Categorize spending to identify patterns",
        "Look for areas where you can cut back"
      ]
    },
    {
      id: 4,
      title: "Pay Off High-Interest Debt First",
      description: "Focus on paying off credit cards and loans with the highest interest rates first. This strategy saves you money in the long run.",
      icon: CreditCard,
      color: "from-red-500 to-orange-500",
      tips: [
        "List all debts with their interest rates",
        "Pay minimums on all, extra on highest rate",
        "Consider debt consolidation if beneficial",
        "Avoid taking on new high-interest debt"
      ]
    },
    {
      id: 5,
      title: "Set SMART Financial Goals",
      description: "Make your financial goals Specific, Measurable, Achievable, Relevant, and Time-bound. This increases your chances of success.",
      icon: Target,
      color: "from-yellow-500 to-orange-500",
      tips: [
        "Write down your goals clearly",
        "Set both short-term and long-term goals",
        "Break large goals into smaller milestones",
        "Review and adjust goals regularly"
      ]
    },
    {
      id: 6,
      title: "Automate Your Finances",
      description: "Set up automatic transfers for savings, bill payments, and investments. Automation helps you stay consistent and avoid late fees.",
      icon: Wallet,
      color: "from-teal-500 to-cyan-500",
      tips: [
        "Automate savings transfers on payday",
        "Set up automatic bill payments",
        "Use recurring investments for long-term goals",
        "Review automated transactions monthly"
      ]
    },
    {
      id: 7,
      title: "Invest for the Long Term",
      description: "Start investing early and consistently. Time and compound interest are your greatest allies in building wealth over the long term.",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      tips: [
        "Start with low-cost index funds",
        "Invest regularly regardless of market conditions",
        "Don't try to time the market",
        "Increase investments with salary raises"
      ]
    },
    {
      id: 8,
      title: "Review and Negotiate Bills",
      description: "Regularly review your recurring expenses and negotiate better rates. Small savings on monthly bills add up significantly over time.",
      icon: Lightbulb,
      color: "from-amber-500 to-yellow-500",
      tips: [
        "Review all subscriptions quarterly",
        "Call providers to negotiate better rates",
        "Compare prices for insurance annually",
        "Cancel unused services immediately"
      ]
    },
    {
      id: 9,
      title: "Educate Yourself Continuously",
      description: "Financial literacy is an ongoing journey. Read books, take courses, and stay informed about personal finance best practices.",
      icon: BookOpen,
      color: "from-indigo-500 to-purple-500",
      tips: [
        "Read one financial book per month",
        "Follow reputable financial blogs and podcasts",
        "Take online courses on investing and budgeting",
        "Join financial communities for support"
      ]
    },
    {
      id: 10,
      title: "Celebrate Financial Milestones",
      description: "Acknowledge your progress and celebrate when you reach financial goals. This positive reinforcement helps maintain motivation.",
      icon: Star,
      color: "from-pink-500 to-rose-500",
      tips: [
        "Set milestone rewards for yourself",
        "Share achievements with supportive friends",
        "Track your net worth growth over time",
        "Reflect on how far you've come regularly"
      ]
    }
  ];

  // Auto-play functionality
  React.useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % tips.length);
    }, 8000); // Change slide every 8 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, tips.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % tips.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + tips.length) % tips.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const currentTip = tips[currentSlide];
  const Icon = currentTip.icon;

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Pro Tips</h1>
          <p className="text-gray-600 mt-2">
            Master your money with these expert financial strategies
          </p>
        </div>

        {/* Slideshow Container */}
        <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Main Slide */}
          <div className={`bg-gradient-to-br ${currentTip.color} p-8 md:p-12 text-white relative`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-2 border-white"></div>
              <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border-2 border-white"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">{currentTip.title}</h2>
                    <p className="text-white text-opacity-90">Tip {currentSlide + 1} of {tips.length}</p>
                  </div>
                </div>
                
                {/* Auto-play toggle */}
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="bg-white bg-opacity-20 p-2 rounded-lg hover:bg-opacity-30 transition-colors duration-200"
                  title={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
                >
                  {isAutoPlaying ? '⏸️' : '▶️'}
                </button>
              </div>

              <p className="text-lg md:text-xl mb-8 leading-relaxed">
                {currentTip.description}
              </p>

              {/* Action Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTip.tips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-white bg-opacity-20 p-1 rounded-full mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <p className="text-white text-opacity-90">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="bg-white p-6">
            <div className="flex items-center justify-between">
              {/* Previous Button */}
              <button
                onClick={prevSlide}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Slide Indicators */}
              <div className="flex space-x-2">
                {tips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                      index === currentSlide
                        ? 'bg-emerald-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={nextSlide}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
            <div 
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / tips.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Navigation Grid */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
          {tips.map((tip, index) => {
            const TipIcon = tip.icon;
            return (
              <button
                key={tip.id}
                onClick={() => goToSlide(index)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  index === currentSlide
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <TipIcon className={`h-6 w-6 mx-auto mb-2 ${
                  index === currentSlide ? 'text-emerald-600' : 'text-gray-600'
                }`} />
                <p className={`text-xs font-medium ${
                  index === currentSlide ? 'text-emerald-900' : 'text-gray-700'
                }`}>
                  {tip.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Apply These Tips?</h2>
          <p className="text-emerald-100 mb-6">
            Start implementing these strategies today with FinWallet's powerful tracking tools
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Go to Dashboard
            </a>
            <a
              href="/transactions"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors duration-200"
            >
              Start Tracking
            </a>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Recommended Reading</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">"The Total Money Makeover"</h4>
              <p className="text-gray-600">by Dave Ramsey</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">"Rich Dad Poor Dad"</h4>
              <p className="text-gray-600">by Robert Kiyosaki</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">"The Intelligent Investor"</h4>
              <p className="text-gray-600">by Benjamin Graham</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialTipsPage;