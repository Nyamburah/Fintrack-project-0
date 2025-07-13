// middleware/ngrokMiddleware.js
const ngrokMiddleware = (req, res, next) => {
    // Skip ngrok browser warning page
    if (req.headers['ngrok-skip-browser-warning'] !== 'true') {
        req.headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    // Add response headers to bypass warning page
    res.setHeader('ngrok-skip-browser-warning', 'true');
    
    // Handle CORS for ngrok tunnels
    const origin = req.headers.origin;
    if (origin && (origin.includes('ngrok.io') || origin.includes('ngrok-free.app'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, ngrok-skip-browser-warning, X-Requested-With'
    );
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Log ngrok requests for debugging (optional)
    if (req.headers.host && req.headers.host.includes('ngrok')) {
        console.log(`Ngrok request: ${req.method} ${req.url} from ${req.headers.host}`);
    }
    
    next();
};

module.exports = ngrokMiddleware;