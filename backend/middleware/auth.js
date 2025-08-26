import express from 'express';
//import bcrypt from 'bcrypt';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import { authenticateToken } from '../middleware/mdw.js';

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, mpesaNumber } = req.body;

    console.log('📝 Registration request received:', {
      name, email, mpesaNumber, password: password ? '[PROVIDED]' : '[MISSING]'
    });

    // Validation
    if (!name || !email || !password || !mpesaNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, email, password, and M-Pesa number are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Clean and normalize data
    const cleanEmail = email.toLowerCase().trim();
    const cleanMpesaNumber = mpesaNumber.trim();

    // Check if user already exists with detailed checking
    const existingUserByEmail = await User.findOne({ email: cleanEmail });
    const existingUserByMpesa = await User.findOne({ mpesaNumber: cleanMpesaNumber });
    
    if (existingUserByEmail) {
      return res.status(409).json({ 
        success: false,
        error: 'An account with this email already exists' 
      });
    }

    if (existingUserByMpesa) {
      return res.status(409).json({ 
        success: false,
        error: 'An account with this M-Pesa number already exists' 
      });
    }

    // Hash password
    const saltRounds = 12; // Increased for better security
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user with cleaned data
    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      mpesaNumber: cleanMpesaNumber
    });

    const savedUser = await user.save();
    console.log('✅ User created successfully:', { id: savedUser._id, email: savedUser.email });

    // Generate JWT token with user ID and email
    const token = jwt.sign(
      { 
        id: savedUser._id.toString(), 
        email: savedUser.email,
        iat: Math.floor(Date.now() / 1000)
      }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        mpesaNumber: savedUser.mpesaNumber
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ 
        success: false,
        error: `An account with this ${field} already exists` 
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Registration failed. Please try again.' 
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Clean email
    const cleanEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      console.log('❌ Login failed: User not found for email:', cleanEmail);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password for user:', user._id);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Generate fresh JWT token
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful for user:', { id: user._id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mpesaNumber: user.mpesaNumber
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed. Please try again.' 
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // The authenticateToken middleware should have populated req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mpesaNumber: req.user.mpesaNumber,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile' 
    });
  }
});

// Get current user (for /auth/me endpoint)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mpesaNumber: req.user.mpesaNumber,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user information' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, mpesaNumber } = req.body;
    const userId = req.user._id;

    // Build update object
    const updateData = {};
    if (name && name.trim()) {
      updateData.name = name.trim();
    }
    if (mpesaNumber && mpesaNumber.trim()) {
      // Check if mpesaNumber is already taken by another user
      const existingUser = await User.findOne({ 
        mpesaNumber: mpesaNumber.trim(), 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'This M-Pesa number is already in use'
        });
      }
      updateData.mpesaNumber = mpesaNumber.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mpesaNumber: updatedUser.mpesaNumber
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'M-Pesa number is already in use'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile' 
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    console.log('✅ Password changed successfully for user:', userId);

    res.json({ 
      success: true,
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to change password' 
    });
  }
});

// Logout (client-side handles token removal)
router.post('/logout', authenticateToken, (req, res) => {
  console.log('🔐 User logged out:', req.user.email);
  res.json({ 
    success: true,
    message: 'Logout successful' 
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