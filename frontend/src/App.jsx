import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CategoriesProvider } from './contexts/CategoriesContext';
import { DataProvider } from './contexts/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import CategoriesPage from './pages/CategoriesPage';
import ReportsPage from './pages/ReportsPage';
import PaymentPage from './pages/PaymentPage';
import FinancialTipsPage from './pages/FinancialTipsPage';



axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true; // Fixed typo

// Protected layout wrapper
const ProtectedLayout = () => (
  <>
    <Navbar />
    <Outlet /> {/* This is crucial for nested routes to render */}
    <Toaster 
      position="bottom-right" 
      toastOptions={{duration: 2000}} // Fixed syntax
    />
  </>
);

function App() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <DataProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
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
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/tips" element={<FinancialTipsPage />} />
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
  );
}

export default App;