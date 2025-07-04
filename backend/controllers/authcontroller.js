const User = require('../models/users')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

const test = (req, res) => {
    res.json('test is working')
}

const registerUser = async(req, res) => {
    try {
        const {name, email, mpesaNumber, password} = req.body;
        
        // Check if name was entered
        if(!name || !name.trim()){
            return res.json({
                error: 'Full name is required'
            })
        };
        
        // Check if name is at least 2 characters
        if(name.trim().length < 2){
            return res.json({
                error: 'Name must be at least 2 characters'
            })
        };
        
        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.json({
                error: 'Please enter a valid email address'
            })
        }
        
        // Check if email already exists
        const exist = await User.findOne({email: email.toLowerCase()});
        if (exist){
            return res.json({
                error: 'Email already exists'
            })
        }

        // Validate Mpesa number (Kenyan phone number format)
        const kenyaPhoneRegex = /^(\+254|254|0)[17]\d{8}$/;
        if (!mpesaNumber || !kenyaPhoneRegex.test(mpesaNumber.replace(/\s/g, ''))) {
            return res.json({
                error: 'Please enter a valid Kenyan phone number'
            })
        }
        
        // Check if password meets requirements (matching frontend validation)
        if (!password) {
            return res.json({
                error: 'Password is required'
            })
        }
        
        if (password.length < 8) {
            return res.json({
                error: 'Password must be at least 8 characters long'
            })
        }
        
        if (!/[A-Z]/.test(password)) {
            return res.json({
                error: 'Password must contain at least one uppercase letter'
            })
        }
        
        if (!/[a-z]/.test(password)) {
            return res.json({
                error: 'Password must contain at least one lowercase letter'
            })
        }
        
        if (!/\d/.test(password)) {
            return res.json({
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
        
        // Return user without password
        const {password: _, ...userWithoutPassword} = user.toObject();
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: userWithoutPassword
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error: 'Server error occurred'
        })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate JWT token (optional, for session)
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user.toObject();
        return res.json({
            success: true,
            user: { ...userWithoutPassword, token },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Server error occurred' });
    }
}

module.exports = {
    test,
    registerUser,
    loginUser
}