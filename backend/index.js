require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express(); 
const port = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Support both ports
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection error:', err));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fintrack API is working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fintrack API is running',
    timestamp: new Date().toISOString(),
    currency: 'KSH',
    mpesa_integration: 'enabled'
  });
});

// Routes
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/auth', require('./routes/authroutes')); // Keep your existing auth routes

// M-Pesa routes
try {
  const mpesaRoutes = require('./routes/mpesaRoutes');
  app.use('/api/mpesa', mpesaRoutes);
  console.log('✅ M-Pesa routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading M-Pesa routes:', error.message);
  console.log('⚠️  Make sure you have created the mpesaRoutes.js file');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 API Health: http://localhost:${port}/api/health`);
  console.log(`💰 Currency: KSH (Kenyan Shillings)`);
  console.log(`📱 M-Pesa API: http://localhost:${port}/api/mpesa`);
  
  // Log environment variables status
  console.log('\n🔧 Environment Check:');
  console.log(`   MongoDB URI: ${process.env.MONGO_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`   M-Pesa Consumer Key: ${process.env.MPESA_CONSUMER_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   M-Pesa Consumer Secret: ${process.env.MPESA_CONSUMER_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   M-Pesa Business Shortcode: ${process.env.MPESA_BUSINESS_SHORTCODE ? '✅ Set' : '❌ Missing'}`);
  console.log(`   M-Pesa Environment: ${process.env.MPESA_ENVIRONMENT || 'sandbox'}`);
});