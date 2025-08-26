const cors = require('cors');

// Enhanced CORS configuration
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

    // Check for ngrok URLs
    if (origin.includes('ngrok.io') || origin.includes('ngrok-free.app')) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow localhost with any port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'ngrok-skip-browser-warning'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Custom CORS middleware
const corsMiddleware = (req, res, next) => {
  // Handle ngrok-specific headers
  if (req.headers['ngrok-skip-browser-warning'] !== 'true') {
    req.headers['ngrok-skip-browser-warning'] = 'true';
  }
  
  res.setHeader('ngrok-skip-browser-warning', 'true');
  
  // Apply CORS
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      console.error('CORS Error:', err.message);
      return res.status(403).json({
        success: false,
        error: 'CORS policy violation'
      });
    }
    
    // Log requests for debugging
    console.log(`${req.method} ${req.url} from ${req.headers.origin || 'unknown origin'}`);
    
    next();
  });
};

module.exports = corsMiddleware;