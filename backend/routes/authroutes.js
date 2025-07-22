/*const express = require('express');
const router = express.Router();
const cors = require('cors');
const { test, registerUser, loginUser } = require('../controllers/authcontroller');

// Middleware - CORS configuration
router.use(
    cors({
        credentials: true,
        origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With', 
            'Content-Type',
            'Accept',
            'Authorization',
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Headers',
            'Access-Control-Allow-Methods'
        ]
    })
);

// Handle preflight requests
router.options('*', cors());

// Routes
router.get('/', test);
router.post('/register', registerUser);
router.post('/login', loginUser);

// Remove duplicate route - this was causing issues
// router.get('/', (req, res) => {
//   res.send("Auth route working");
// });

module.exports = router;*/