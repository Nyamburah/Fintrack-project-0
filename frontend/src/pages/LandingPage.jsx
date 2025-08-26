import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  ArrowRight,
  DollarSign,
  Coins,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Flame,
  Award,
  Users,
  Star,
  Check,
  MessageCircle,
  Globe,
  Lock,
  RefreshCw
} from 'lucide-react';

/**
 * Landing Page Component - Version 2
 * Pure CSS styling without Tailwind
 */
const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [floatingCoins, setFloatingCoins] = useState([]);

  useEffect(() => {
    setIsVisible(true);
    
    // Generate floating coins
    const coins = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 90,
      y: Math.random() * 90,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 20 + Math.random() * 25,
      color: ['#22c55e', '#10b981', '#14b8a6', '#84cc16', '#eab308'][Math.floor(Math.random() * 5)]
    }));
    setFloatingCoins(coins);
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f0fdf4, #ecfdf5, #f0fdfa)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
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
      animation: 'bounce 2s infinite'
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
      top: '-160px',
      right: '-160px',
      width: '384px',
      height: '384px',
      background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4))',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 4s infinite'
    },
    bgCircle2: {
      position: 'absolute',
      bottom: '-160px',
      left: '-160px',
      width: '320px',
      height: '320px',
      background: 'radial-gradient(circle, rgba(20, 184, 166, 0.4), rgba(34, 197, 94, 0.4))',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 4s infinite 1s'
    },
    bgCircle3: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '288px',
      height: '288px',
      background: 'radial-gradient(circle, rgba(132, 204, 22, 0.3), rgba(16, 185, 129, 0.3))',
      borderRadius: '50%',
      filter: 'blur(60px)',
      animation: 'pulse 4s infinite 0.5s'
    },
    nav: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      borderBottom: '4px solid #22c55e',
      position: 'sticky',
      top: 0,
      zIndex: 50
    },
    navContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '80px'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logo: {
      position: 'relative'
    },
    logoInner: {
      background: 'linear-gradient(to bottom right, #059669, #10b981, #14b8a6)',
      padding: '16px',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transform: 'scale(1)',
      transition: 'all 0.5s ease',
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
      background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), transparent)',
      animation: 'pulse 2s infinite'
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
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    bill1: {
      background: 'linear-gradient(to right, #22c55e, #16a34a)',
      transform: 'rotate(12deg)',
      opacity: 0.8
    },
    bill2: {
      background: 'linear-gradient(to right, #10b981, #059669)',
      transform: 'rotate(6deg)',
      opacity: 0.9
    },
    bill3: {
      background: 'linear-gradient(to right, #84cc16, #65a30d)',
      position: 'relative',
      zIndex: 10
    },
    dollarSign: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '40px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '12px',
      zIndex: 20
    },
    sparkle1: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      width: '8px',
      height: '8px',
      background: '#fbbf24',
      borderRadius: '50%',
      animation: 'ping 2s infinite'
    },
    sparkle2: {
      position: 'absolute',
      bottom: '-4px',
      left: '-4px',
      width: '4px',
      height: '4px',
      background: '#84cc16',
      borderRadius: '50%',
      animation: 'ping 2s infinite 1s'
    },
    brandText: {
      fontSize: '32px',
      fontWeight: '900',
      background: 'linear-gradient(to right, #15803d, #059669, #0d9488)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    navButtons: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    },
    loginBtn: {
      color: '#374151',
      fontWeight: 'bold',
      fontSize: '18px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      padding: '8px 16px'
    },
    getStartedBtn: {
      background: 'linear-gradient(to right, #059669, #10b981, #0d9488)',
      color: 'white',
      padding: '12px 32px',
      borderRadius: '50px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px'
    },
    heroSection: {
      padding: '128px 16px',
      position: 'relative',
      zIndex: 10
    },
    heroContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      textAlign: 'center'
    },
    heroContent: {
      transition: 'all 1s ease',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(40px)'
    },
    mainHeading: {
      fontSize: '96px',
      fontWeight: '900',
      color: '#111827',
      marginBottom: '24px',
      lineHeight: '1.1'
    },
    gradientText: {
      background: 'linear-gradient(to right, #059669, #10b981, #0d9488)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    slogan: {
      fontSize: '32px',
      color: '#15803d',
      marginBottom: '48px',
      maxWidth: '1024px',
      margin: '0 auto 48px auto',
      fontWeight: 'bold'
    },
    ctaButton: {
      background: 'linear-gradient(to right, #059669, #10b981, #0d9488)',
      color: 'white',
      padding: '24px 48px',
      borderRadius: '50px',
      fontSize: '32px',
      fontWeight: '900',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    },
    ctaOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(to right, #84cc16, #22c55e)',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
    footer: {
      background: 'linear-gradient(to bottom right, #111827, #14532d, #064e3b)',
      color: 'white',
      padding: '64px 0',
      position: 'relative',
      overflow: 'hidden'
    },
    footerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(to bottom right, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))'
    },
    footerContainer: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 16px',
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    footerBrand: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px'
    },
    footerBrandText: {
      fontSize: '32px',
      fontWeight: '900',
      background: 'linear-gradient(to right, #22c55e, #10b981, #14b8a6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    footerText: {
      textAlign: 'right'
    },
    copyright: {
      fontSize: '20px',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #22c55e, #10b981)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    tagline: {
      fontSize: '18px',
      marginTop: '8px',
      color: '#84cc16',
      fontWeight: '600'
    },
    // Features Section Styles
    featuresSection: {
      padding: '96px 16px',
      background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
      position: 'relative',
      zIndex: 10
    },
    featuresContainer: {
      maxWidth: '1280px',
      margin: '0 auto'
    },
    sectionTitle: {
      fontSize: '48px',
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: '24px',
      background: 'linear-gradient(to right, #059669, #10b981, #0d9488)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    sectionSubtitle: {
      fontSize: '20px',
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: '64px',
      maxWidth: '768px',
      margin: '0 auto 64px auto'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '32px',
      marginBottom: '96px'
    },
    featureCard: {
      background: 'white',
      padding: '32px',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    featureIcon: {
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      position: 'relative'
    },
    featureTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '16px'
    },
    featureDescription: {
      fontSize: '16px',
      color: '#6b7280',
      lineHeight: '1.6'
    },
    // Why Choose Us Section
    whyChooseSection: {
      padding: '96px 16px',
      background: 'linear-gradient(to bottom right, #059669, #10b981, #0d9488)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    },
    whyChooseOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      backdropFilter: 'blur(10px)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '32px',
      marginTop: '64px'
    },
    statCard: {
      textAlign: 'center',
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '32px',
      borderRadius: '16px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    statNumber: {
      fontSize: '48px',
      fontWeight: '900',
      marginBottom: '8px'
    },
    statLabel: {
      fontSize: '16px',
      opacity: 0.9
    },
    // Testimonials Section
    testimonialsSection: {
      padding: '96px 16px',
      background: '#f9fafb'
    },
    testimonialsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '32px',
      marginTop: '64px'
    },
    testimonialCard: {
      background: 'white',
      padding: '32px',
      borderRadius: '24px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    },
    testimonialQuote: {
      fontSize: '18px',
      color: '#374151',
      marginBottom: '24px',
      lineHeight: '1.6',
      fontStyle: 'italic'
    },
    testimonialAuthor: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    authorAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '18px'
    },
    authorInfo: {
      flex: 1
    },
    authorName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '4px'
    },
    authorTitle: {
      fontSize: '14px',
      color: '#6b7280'
    },
    stars: {
      display: 'flex',
      gap: '4px',
      color: '#fbbf24'
    },
    // CTA Section
    ctaSection: {
      padding: '96px 16px',
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #059669 100%)',
      color: 'white',
      textAlign: 'center'
    },
    ctaSectionTitle: {
      fontSize: '48px',
      fontWeight: '900',
      marginBottom: '24px'
    },
    ctaSectionSubtitle: {
      fontSize: '20px',
      marginBottom: '48px',
      opacity: 0.9,
      maxWidth: '768px',
      margin: '0 auto 48px auto'
    }
  };

  // Add keyframes for animations
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
        40%, 43% { transform: translateY(-10px); }
        70% { transform: translateY(-5px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes ping {
        75%, 100% { transform: scale(2); opacity: 0; }
      }
      @media (max-width: 768px) {
        .main-heading { font-size: 48px !important; }
        .slogan { font-size: 20px !important; }
        .cta-button { font-size: 20px !important; padding: 16px 32px !important; }
        .brand-text { font-size: 24px !important; }
      }
      @media (max-width: 1024px) {
        .features-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; }
        .stats-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important; }
        .testimonials-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; }
      }
      @media (max-width: 640px) {
        .section-title { font-size: 32px !important; }
        .section-subtitle { font-size: 16px !important; }
        .feature-title { font-size: 20px !important; }
        .cta-section-title { font-size: 32px !important; }
        .cta-section-subtitle { font-size: 16px !important; }
        .nav-buttons { flex-direction: column; gap: 12px !important; }
        .hero-section { padding: 64px 16px !important; }
        .features-section, .why-choose-section, .testimonials-section, .cta-section { padding: 64px 16px !important; }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const handleGetStarted = () => {
    // Navigate to registration page
    window.location.href = '/register';
  };

  const handleLogin = () => {
    // Navigate to login page  
    window.location.href = '/login';
  };

  return (
    <div style={styles.container}>
      {/* Floating money animations */}
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

      {/* Background elements */}
      <div style={styles.backgroundElements}>
        <div style={styles.bgCircle1}></div>
        <div style={styles.bgCircle2}></div>
        <div style={styles.bgCircle3}></div>
      </div>

      {/* Navigation Header */}
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>
              <div 
                style={styles.logoInner}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <div style={styles.logoShine}></div>
                <div style={styles.billStack}>
                  <div style={{...styles.bill, ...styles.bill1}}></div>
                  <div style={{...styles.bill, ...styles.bill2}}></div>
                  <div style={{...styles.bill, ...styles.bill3}}>
                    <div style={{position: 'absolute', top: '2px', left: '2px', width: '4px', height: '4px', background: 'white', borderRadius: '50%', opacity: 0.7}}></div>
                    <div style={{position: 'absolute', bottom: '2px', right: '2px', width: '4px', height: '4px', background: 'white', borderRadius: '50%', opacity: 0.7}}></div>
                  </div>
                  <div style={styles.dollarSign}>
                    <DollarSign size={12} />
                  </div>
                </div>
                <div style={styles.sparkle1}></div>
                <div style={styles.sparkle2}></div>
              </div>
            </div>
            <span style={styles.brandText} className="brand-text">FinTrack</span>
          </div>
          
          <div style={styles.navButtons}>
            <button
              onClick={handleLogin}
              style={styles.loginBtn}
              onMouseEnter={(e) => {
                e.target.style.color = '#059669';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#374151';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Login
            </button>
            <button
              onClick={handleGetStarted}
              style={styles.getStartedBtn}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(to right, #047857, #059669, #0f766e)';
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(to right, #059669, #10b981, #0d9488)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
            >
              <span>Get Started</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <h1 style={styles.mainHeading} className="main-heading">
              Master Your{' '}
              <span style={styles.gradientText}>Money Game</span>
            </h1>
            
            <p style={styles.slogan} className="slogan">
              💚 Track it, stack it, make it count! 💚
            </p>
            
            <button
              onClick={handleGetStarted}
              style={styles.ctaButton}
              className="cta-button"
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(to right, #047857, #059669, #0f766e)';
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
                e.target.querySelector('.cta-overlay').style.opacity = '0.2';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(to right, #059669, #10b981, #0d9488)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                e.target.querySelector('.cta-overlay').style.opacity = '0';
              }}
            >
              <div style={styles.ctaOverlay} className="cta-overlay"></div>
              <Smartphone size={32} />
              <span>Start Your Journey! 🎯</span>
              <ArrowRight size={32} />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.sectionTitle} className="section-title">Why FinTrack? 🚀</h2>
          <p style={styles.sectionSubtitle}>
            Discover the powerful features that make financial tracking simple, smart, and rewarding
          </p>
          
          <div style={styles.featuresGrid} className="features-grid">
            <div 
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                ...styles.featureIcon,
                background: 'linear-gradient(135deg, #10b981, #059669)'
              }}>
                <Flame size={32} color="white" />
              </div>
              <h3 style={styles.featureTitle}>🔥 Daily Streak System</h3>
              <p style={styles.featureDescription}>
                Build consistent financial habits with our gamified streak system. Track consecutive days of financial activity and unlock achievements as you maintain your momentum!
              </p>
            </div>

            <div 
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                ...styles.featureIcon,
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
              }}>
                <Smartphone size={32} color="white" />
              </div>
              <h3 style={styles.featureTitle}>📱 M-Pesa Integration</h3>
              <p style={styles.featureDescription}>
                Seamlessly track your M-Pesa transactions with automatic categorization. Connect your mobile money account and get real-time insights into your spending patterns.
              </p>
            </div>

            <div 
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                ...styles.featureIcon,
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
              }}>
                <BarChart3 size={32} color="white" />
              </div>
              <h3 style={styles.featureTitle}>📊 Smart Analytics</h3>
              <p style={styles.featureDescription}>
                Get detailed insights with beautiful charts and reports. Understand your spending patterns, track budget performance, and make informed financial decisions.
              </p>
            </div>

            <div 
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                ...styles.featureIcon,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)'
              }}>
                <Target size={32} color="white" />
              </div>
              <h3 style={styles.featureTitle}>🎯 Goal Setting</h3>
              <p style={styles.featureDescription}>
                Set and achieve your financial goals with our intelligent tracking system. Create budgets, monitor progress, and celebrate milestones along your journey.
              </p>
            </div>

            <div 
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                ...styles.featureIcon,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)'
              }}>
                <Shield size={32} color="white" />
              </div>
              <h3 style={styles.featureTitle}>🔒 Bank-Level Security</h3>
              <p style={styles.featureDescription}>
                Your financial data is protected with enterprise-grade encryption and security measures. We never store sensitive banking information on our servers.
              </p>
            </div>

            <div 
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 35px 60px -12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                ...styles.featureIcon,
                background: 'linear-gradient(135deg, #14b8a6, #0d9488)'
              }}>
                <Zap size={32} color="white" />
              </div>
              <h3 style={styles.featureTitle}>⚡ Real-Time Updates</h3>
              <p style={styles.featureDescription}>
                Stay on top of your finances with instant notifications and real-time balance updates. Never miss an important transaction or budget alert again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section style={styles.whyChooseSection}>
        <div style={styles.whyChooseOverlay}></div>
        <div style={styles.featuresContainer}>
          <h2 style={{...styles.sectionTitle, color: 'white'}}>Trusted by Thousands 🌟</h2>
          <p style={{...styles.sectionSubtitle, color: 'rgba(255, 255, 255, 0.9)'}}>
            Join the growing community of smart money managers who've transformed their financial lives with FinTrack
          </p>
          
          <div style={styles.statsGrid} className="stats-grid">
            <div style={styles.statCard}>
              <div style={styles.statNumber}>10K+</div>
              <div style={styles.statLabel}>Active Users</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>Ksh 50M+</div>
              <div style={styles.statLabel}>Money Tracked</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>95%</div>
              <div style={styles.statLabel}>User Satisfaction</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>24/7</div>
              <div style={styles.statLabel}>Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={styles.testimonialsSection}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.sectionTitle}>What Our Users Say 💬</h2>
          <p style={styles.sectionSubtitle}>
            Real stories from real people who've transformed their financial habits with FinTrack
          </p>
          
          <div style={styles.testimonialsGrid} className="testimonials-grid">
            <div style={styles.testimonialCard}>
              <div style={styles.stars}>
                {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <p style={styles.testimonialQuote}>
                "FinTrack completely changed how I manage my M-Pesa transactions. The streak system keeps me motivated to track every expense. I've saved over KES 50,000 in just 6 months!"
              </p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.authorAvatar}>AM</div>
                <div style={styles.authorInfo}>
                  <div style={styles.authorName}>Aisha Mwangi</div>
                  <div style={styles.authorTitle}>Small Business Owner, Nairobi</div>
                </div>
              </div>
            </div>

            <div style={styles.testimonialCard}>
              <div style={styles.stars}>
                {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <p style={styles.testimonialQuote}>
                "As a university student, keeping track of my spending was always a challenge. FinTrack's simple interface and goal-setting features helped me stay within budget and even save for my laptop!"
              </p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.authorAvatar}>DK</div>
                <div style={styles.authorInfo}>
                  <div style={styles.authorName}>David Kiprotich</div>
                  <div style={styles.authorTitle}>University Student, Eldoret</div>
                </div>
              </div>
            </div>

            <div style={styles.testimonialCard}>
              <div style={styles.stars}>
                {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <p style={styles.testimonialQuote}>
                "The analytics dashboard is incredible! I can see exactly where my money goes each month. The security features give me peace of mind, and customer support is always helpful."
              </p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.authorAvatar}>GW</div>
                <div style={styles.authorInfo}>
                  <div style={styles.authorName}>Grace Wanjiku</div>
                  <div style={styles.authorTitle}>Marketing Manager, Mombasa</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.featuresContainer}>
          <h2 style={styles.ctaSectionTitle}>Ready to Master Your Money? 💰</h2>
          <p style={styles.ctaSectionSubtitle}>
            Join thousands of smart money managers who've already transformed their financial lives. Start your journey today - it's completely free!
          </p>
          
          <div style={{display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <button
              onClick={handleGetStarted}
              style={{
                ...styles.ctaButton,
                background: 'linear-gradient(to right, #10b981, #059669)',
                fontSize: '20px',
                padding: '20px 40px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(to right, #059669, #047857)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(to right, #10b981, #059669)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <span>Start Free Today</span>
              <ArrowRight size={24} />
            </button>
            
            <button
              onClick={handleLogin}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                padding: '20px 40px',
                borderRadius: '50px',
                fontSize: '20px',
                fontWeight: '600',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            >
              <span>Already have an account?</span>
            </button>
          </div>
        </div>
      </section>
     
      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerOverlay}></div>
        <div style={styles.footerContainer}>
          <div style={styles.footerBrand}>
            <div style={styles.logo}>
              <div style={styles.logoInner}>
                <div style={styles.logoShine}></div>
                <div style={styles.billStack}>
                  <div style={{...styles.bill, ...styles.bill1}}></div>
                  <div style={{...styles.bill, ...styles.bill2}}></div>
                  <div style={{...styles.bill, ...styles.bill3}}>
                    <div style={{position: 'absolute', top: '2px', left: '2px', width: '4px', height: '4px', background: 'white', borderRadius: '50%', opacity: 0.7}}></div>
                    <div style={{position: 'absolute', bottom: '2px', right: '2px', width: '4px', height: '4px', background: 'white', borderRadius: '50%', opacity: 0.7}}></div>
                  </div>
                  <div style={styles.dollarSign}>
                    <DollarSign size={12} />
                  </div>
                </div>
                <div style={styles.sparkle1}></div>
                <div style={styles.sparkle2}></div>
              </div>
            </div>
            <span style={styles.footerBrandText}>FinTrack</span>
          </div>
          
          <div style={styles.footerText}>
            <p style={styles.copyright}>
              &copy; 2024 FinTrack. All rights reserved.
            </p>
            <p style={styles.tagline}>
              🌱 Growing your wealth, one track at a time! 💚
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;