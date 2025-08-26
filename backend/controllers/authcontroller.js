import User from '../models/users.js';
//import bcrypt from 'bcrypt';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const test = (req, res) => {
    res.json({
        success: true,
        message: 'Auth controller test is working',
        timestamp: new Date().toISOString()
    });
}

const registerUser = async(req, res) => {
    try {
        const {name, email, mpesaNumber, password} = req.body;
        
        console.log('📝 Registration request received:', {
            name, email, mpesaNumber, password: password ? '[PROVIDED]' : '[MISSING]'
        });
        
        // Check if name was entered
        if(!name || !name.trim()){
            return res.status(400).json({
                success: false,
                error: 'Full name is required'
            })
        };
        
        // Check if name is at least 2 characters
        if(name.trim().length < 2){
            return res.status(400).json({
                success: false,
                error: 'Name must be at least 2 characters'
            })
        };
        
        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address'
            })
        }
        
        // Check if email already exists
        const exist = await User.findOne({email: email.toLowerCase()});
        if (exist){
            return res.status(409).json({
                success: false,
                error: 'Email already exists'
            })
        }

        // Validate Mpesa number (Kenyan phone number format)
        const kenyaPhoneRegex = /^(\+254|254|0)[17]\d{8}$/;
        if (!mpesaNumber || !kenyaPhoneRegex.test(mpesaNumber.replace(/\s/g, ''))) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid Kenyan phone number'
            })
        }

        // Check if mpesa number already exists
        const existingMpesa = await User.findOne({mpesaNumber: mpesaNumber.trim()});
        if (existingMpesa) {
            return res.status(409).json({
                success: false,
                error: 'This M-Pesa number is already registered'
            })
        }
        
        // Check if password meets requirements (matching frontend validation)
        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password is required'
            })
        }
        
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long'
            })
        }
        
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one uppercase letter'
            })
        }
        
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one lowercase letter'
            })
        }
        
        if (!/\d/.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must contain at least one number'
            })
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(), 
            email: email.toLowerCase(), 
            mpesaNumber: mpesaNumber.trim(),
            password: hashedPassword
        })
        
        console.log(`✅ New user registered: ${user.email} (ID: ${user._id})`);
        
        // Generate JWT token for immediate login after registration
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                name: user.name,
                mpesaNumber: user.mpesaNumber
            }, 
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: '7d' }
        );
        
        // Return user without password
        const {password: _, ...userWithoutPassword} = user.toObject();
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: userWithoutPassword
        })

    } catch (error) {
        console.error('❌ Registration error:', error);
        
        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const fieldName = field === 'mpesaNumber' ? 'M-Pesa number' : field;
            return res.status(409).json({
                success: false,
                error: `This ${fieldName} is already registered`
            });
        }
        
        return res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt for:', email);
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Email and password are required' 
            });
        }
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('❌ Login failed: User not found for email:', email.toLowerCase());
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password' 
            });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Login failed: Invalid password for user:', user._id);
            return res.status(401).json({ 
                success: false,
                error: 'Invalid email or password' 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                name: user.name,
                mpesaNumber: user.mpesaNumber
            }, 
            process.env.JWT_SECRET || 'your-secret-key', 
            { expiresIn: '7d' }
        );
        
        console.log(`✅ Login successful for user: ${user.email} (ID: ${user._id})`);
        
        // Return user data with token (without password)
        const { password: _, ...userWithoutPassword } = user.toObject();
        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Login failed. Please try again.' 
        });
    }
}

// Get current user profile
const getProfile = async (req, res) => {
    try {
        // User is attached to req.user by auth middleware (not req.userId)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        
        console.log(`👤 Profile requested for user: ${req.user.email} (ID: ${req.user._id})`);
        
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
        console.error('❌ Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, mpesaNumber } = req.body;
        const userId = req.user._id; // Changed from req.userId to req.user._id
        
        console.log('📝 Profile update request for user:', userId, { name, mpesaNumber });
        
        // Find current user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Build update object
        const updateData = {};
        
        // Validate name if provided
        if (name !== undefined) {
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Name cannot be empty'
                });
            }
            
            if (name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Name must be at least 2 characters'
                });
            }
            
            updateData.name = name.trim();
        }
        
        // Validate M-Pesa number if provided
        if (mpesaNumber !== undefined) {
            const kenyaPhoneRegex = /^(\+254|254|0)[17]\d{8}$/;
            if (!mpesaNumber || !kenyaPhoneRegex.test(mpesaNumber.replace(/\s/g, ''))) {
                return res.status(400).json({
                    success: false,
                    error: 'Please enter a valid Kenyan phone number'
                });
            }
            
            // Check if mpesa number is already taken by another user
            const existingMpesa = await User.findOne({
                mpesaNumber: mpesaNumber.trim(),
                _id: { $ne: userId }
            });
            
            if (existingMpesa) {
                return res.status(409).json({
                    success: false,
                    error: 'This M-Pesa number is already registered'
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
        
        console.log(`✅ Profile updated for user: ${updatedUser.email}`);
        
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
        console.error('❌ Profile update error:', error);
        
        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const fieldName = field === 'mpesaNumber' ? 'M-Pesa number' : field;
            return res.status(409).json({
                success: false,
                error: `This ${fieldName} is already registered`
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id; // Changed from req.userId to req.user._id
        
        console.log('🔐 Password change request for user:', userId);
        
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }
        
        // Validate new password
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 8 characters long'
            });
        }
        
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: 'New password must contain at least one uppercase letter'
            });
        }
        
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: 'New password must contain at least one lowercase letter'
            });
        }
        
        if (!/\d/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                error: 'New password must contain at least one number'
            });
        }
        
        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                error: 'New password must be different from current password'
            });
        }
        
        // Hash and save new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await user.save();
        
        console.log(`✅ Password changed for user: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('❌ Password change error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
};

export {
    test,
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword
};