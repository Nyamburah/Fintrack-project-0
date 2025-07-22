require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express(); 
const port = process.env.PORT || 8000;

// Enhanced CORS configuration (this handles everything)
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    // Add any ngrok URLs you're using
    /.*\.ngrok\.io$/,
    /.*\.ngrok-free\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'ngrok-skip-browser-warning'  // Add ngrok header here
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200
};

// Apply CORS first
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Simple ngrok middleware (only for ngrok-specific headers, not CORS)
app.use((req, res, next) => {
  // Only handle ngrok browser warning, let CORS package handle CORS
  if (req.headers['ngrok-skip-browser-warning'] !== 'true') {
    req.headers['ngrok-skip-browser-warning'] = 'true';
  }
  res.setHeader('ngrok-skip-browser-warning', 'true');
  
  // Log ngrok requests for debugging
  if (req.headers.host && req.headers.host.includes('ngrok')) {
    console.log(`Ngrok request: ${req.method} ${req.url} from ${req.headers.host}`);
  }
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced request logging for debugging
app.use((req, res, next) => {
  console.log(`\n📝 ${req.method} ${req.path}`);
  console.log('Headers:', {
    'content-type': req.headers['content-type'],
    'origin': req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', req.body);
  }
  console.log('─'.repeat(50));
  next();
});

// Debug environment variables
console.log('\n🔍 Environment Variables Check:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || '8000');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Use MONGO_URI first, fallback to MONGODB_URI
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('❌ No MongoDB connection string found!');
  console.error('Please check that either MONGO_URI or MONGODB_URI is set in your .env file');
  process.exit(1);
}

// Database connection with better error handling
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✅ Database connected successfully');
    console.log('📊 Connected to:', mongoose.connection.db.databaseName);
    console.log('🔗 Host:', mongoose.connection.host);
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.error('🔍 Connection string format should be:');
    console.error('mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    process.exit(1);
  });

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB connection disconnected');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: port,
    mongoUri: mongoURI ? 'configured' : 'not configured'
  });
  //i just fixed this part
  const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import middleware
const corsMiddleware = require('./middleware/corsMiddleware');
const ngrokMiddleware = require('./middleware/ngrokMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
// Add other route imports here as needed
// const transactionRoutes = require('./routes/transactions');
// const budgetRoutes = require('./routes/budgets');

const app = express();
const PORT = process.env.PORT || 8000;

// Database connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your-app-name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Middleware - ORDER MATTERS!
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Apply CORS middleware first
app.use(corsMiddleware);

// Apply ngrok middleware for tunnel support
app.use(ngrokMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
// Add other routes here
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/budgets', budgetRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Personal Finance API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
});

module.exports = app;
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fintrack API is working',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      mpesa: '/api/mpesa/*',
      categories: '/api/categories/*',
      transactions: '/api/transactions/*'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Fintrack API is running',
    timestamp: new Date().toISOString(),
    currency: 'KSH',
    mpesa_integration: 'enabled',
    cors_enabled: true,
    allowed_origins: corsOptions.origin,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test endpoint for registration debugging
app.post('/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedData: req.body,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Your routes
app.use('/api/mpesa', require('./routes/mpesa'));
app.use('/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Error occurred:');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    path: req.path
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('🔍 404 - Endpoint not found:', req.originalUrl);
  res.status(404).json({ 
    error: 'API endpoint not found',
    requestedPath: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/health',
      'POST /auth/register',
      'POST /auth/login',
      'GET /api/categories',
      'POST /api/transactions',
      'GET /api/mpesa/*'
    ]
  });
});

app.listen(port, () => {
  console.log('\n🚀 Server Information:');
  console.log(`📍 Port: ${port}`);
  console.log(`🌐 Local URL: http://localhost:${port}`);
  console.log(`🔗 Frontend URL: http://localhost:5173`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS Origins: ${corsOptions.origin.join(', ')}`);
  console.log('\n✅ Server is running and ready to accept connections\n');
});