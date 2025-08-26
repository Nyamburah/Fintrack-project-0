import express from 'express';
import { 
    test, 
    registerUser, 
    loginUser, 
    getProfile, 
    updateProfile, 
    changePassword 
} from '../controllers/authcontroller.js';
import { authenticateToken } from '../middleware/mdw.js';

const router = express.Router();

// Public routes
router.get('/', test); // Root route uses test controller
router.get('/test', test);
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);
router.get('/me', authenticateToken, getProfile); // Uses same controller as profile
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Logout route (client-side implementation, but we can log it)
router.post('/logout', authenticateToken, (req, res) => {
    console.log(`🔐 User logged out: ${req.user.email} (ID: ${req.user._id})`);
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Check if user is authenticated / Verify token endpoint
router.get('/check', authenticateToken, (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        message: 'Token is valid',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            mpesaNumber: req.user.mpesaNumber,
            createdAt: req.user.createdAt
        }
    });
});

// Alternative verify endpoint (same functionality as check)
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            mpesaNumber: req.user.mpesaNumber,
            createdAt: req.user.createdAt
        }
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Auth service is running',
        timestamp: new Date().toISOString()
    });
});

export default router;