import jwt from 'jsonwebtoken';
import User from '../models/users.js';

const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
   
    // Find user and attach to request
    const user = await User.findById(decoded.id).select('-password');
   
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id.toString();
   
    console.log('✅ User authenticated:', {
      id: user._id,
      email: user.email,
      name: user.name
    });
   
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
   
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
   
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
   
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Optional: Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Enhanced middleware for role-based access
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role || 'user'];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role(s): ${requiredRoles.join(', ')}`
      });
    }
    
    next();
  };
};

// Middleware to check if user owns the resource
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user._id.toString();
      
      // For routes where we're checking if user owns the resource
      // This assumes the resource has a userId field
      if (req.body[userIdField] && req.body[userIdField] !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own resources.'
        });
      }
      
      next();
    } catch (error) {
      console.error('❌ Ownership check error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

// Rate limiting middleware (simple in-memory implementation)
const createRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const identifier = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create user's request history
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    next();
  };
};

// Create an alias for auth
const auth = authenticateToken;

export {
  authenticateToken,
  auth, // Add this export
  requireAdmin,
  requireRole,
  requireOwnership,
  createRateLimiter
};

// Default export for backward compatibility
export default authenticateToken;