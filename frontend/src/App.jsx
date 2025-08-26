import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';




axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true; // Fixed typo

// Protected layout wrapper with sidebar
const ProtectedLayout = () => {
  const { isDark } = useTheme();
  
  return (
    <>
      <Sidebar />
      <div style={{
        marginLeft: '18rem',
        minHeight: '100vh',
        backgroundColor: isDark ? '#111827' : '#f9fafb',
        transition: 'all 0.3s'
      }}>
        <Outlet /> {/* This is crucial for nested routes to render */}
      </div>
      <Toaster 
        position="bottom-right" 
        toastOptions={{duration: 2000}}
      />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CategoriesProvider>
          <DataProvider>
            <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes with layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <ProtectedLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>

                {/* Catch-all route */}
                <Route
                  path="*"
                  element={
                    <div className="p-8 text-center text-gray-600 text-xl">
                      404 - Page Not Found
                    </div>
                  }
                />
              </Routes>
            </div>
          </Router>
          </DataProvider>
        </CategoriesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;