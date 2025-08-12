import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  ArrowRight,
  DollarSign,
  Coins
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