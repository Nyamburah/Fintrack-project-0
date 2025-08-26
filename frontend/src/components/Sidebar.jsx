import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import {
  Home,
  Tag,
  Receipt,
  BarChart3,
  LogOut,
  Wallet,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation items with their routes, icons and colors
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: Home,
      color: '#3B82F6', // blue
      hoverColor: '#2563EB'
    },
    { 
      path: '/categories', 
      label: 'Categories', 
      icon: Tag,
      color: '#8B5CF6', // purple
      hoverColor: '#7C3AED'
    },
    { 
      path: '/transactions', 
      label: 'Transactions', 
      icon: Receipt,
      color: '#10B981', // emerald
      hoverColor: '#059669'
    },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: BarChart3,
      color: '#F97316', // orange
      hoverColor: '#EA580C'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 40,
    height: '100vh',
    width: isCollapsed ? '5rem' : '18rem',
    backgroundColor: isDark ? '#111827' : '#ffffff',
    borderRight: `2px solid ${isDark ? '#374151' : '#D1D5DB'}`,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    transition: 'all 0.3s ease-in-out',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem',
    borderBottom: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`
  };

  const logoContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  };

  const logoIconStyles = {
    padding: '0.75rem',
    borderRadius: '0.75rem',
    background: 'linear-gradient(to bottom right, #10B981, #0D9488)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  const titleStyles = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: isDark ? '#ffffff' : '#111827',
    margin: 0
  };

  const subtitleStyles = {
    fontSize: '0.875rem',
    color: isDark ? '#9CA3AF' : '#6B7280',
    margin: 0
  };

  const themeToggleStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.75rem',
    backgroundColor: isDark ? '#374151' : '#E5E7EB',
    color: isDark ? '#FCD34D' : '#374151',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    transform: 'scale(1)'
  };

  const navStyles = {
    flex: 1,
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto'
  };

  const logoutSectionStyles = {
    padding: '1rem',
    borderTop: `1px solid ${isDark ? '#4B5563' : '#D1D5DB'}`
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 50,
          display: window.innerWidth < 1024 ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '3rem',
          height: '3rem',
          backgroundColor: isDark ? '#374151' : '#ffffff',
          color: isDark ? '#ffffff' : '#374151',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside style={sidebarStyles}>
        {/* Header Section */}
        <div style={headerStyles}>
          <div style={logoContainerStyles}>
            <div style={logoIconStyles}>
              <Wallet size={32} color="white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 style={titleStyles}>FinTrack</h1>
                <p style={subtitleStyles}>Smart Finance</p>
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={themeToggleStyles}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isDark ? '#4B5563' : '#D1D5DB';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isDark ? '#374151' : '#E5E7EB';
              e.target.style.transform = 'scale(1)';
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={navStyles}>
          {navItems.map(({ path, label, icon: IconComponent, color, hoverColor }) => {
            const isActive = location.pathname === path;
            
            const linkStyles = {
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
              position: 'relative',
              gap: isCollapsed ? 0 : '1rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              background: isActive ? 'linear-gradient(to right, #10B981, #059669)' : 'transparent',
              boxShadow: isActive ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            };

            const iconStyles = {
              color: isActive ? 'white' : color,
              transition: 'all 0.2s'
            };

            const labelStyles = {
              fontWeight: '600',
              color: isActive ? 'white' : (isDark ? '#E5E7EB' : '#374151'),
              margin: 0,
              fontSize: '0.875rem'
            };

            return (
              <Link
                key={path}
                to={path}
                style={linkStyles}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = isDark ? '#1F2937' : '#F3F4F6';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    const icon = e.currentTarget.querySelector('.nav-icon');
                    if (icon) icon.style.color = hoverColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                    const icon = e.currentTarget.querySelector('.nav-icon');
                    if (icon) icon.style.color = color;
                  }
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '4px',
                      height: '2.5rem',
                      backgroundColor: 'white',
                      borderRadius: '0 0.25rem 0.25rem 0'
                    }}
                  />
                )}
                
                {/* Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                }}>
                  <IconComponent 
                    className="nav-icon"
                    size={isActive ? 24 : 20} 
                    style={iconStyles}
                  />
                </div>
                
                {/* Label */}
                {!isCollapsed && (
                  <span style={labelStyles}>
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div style={logoutSectionStyles}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: isDark ? '#E5E7EB' : '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: isCollapsed ? 0 : '0.75rem',
              justifyContent: isCollapsed ? 'center' : 'flex-start'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(to right, #EF4444, #DC2626)';
              e.target.style.color = 'white';
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = isDark ? '#E5E7EB' : '#374151';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem'
            }}>
              <LogOut size={20} style={{ color: '#EF4444' }} />
            </div>
            
            {!isCollapsed && (
              <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                Logout
              </span>
            )}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute',
            top: '50%',
            right: '-12px',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: isDark ? '#374151' : '#ffffff',
            border: `2px solid ${isDark ? '#4B5563' : '#D1D5DB'}`,
            color: isDark ? '#ffffff' : '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 10
          }}
        >
          <span style={{
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s',
            fontSize: '12px'
          }}>
            ›
          </span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;