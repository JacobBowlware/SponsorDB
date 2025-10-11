const setCorsHeaders = (req, res) => {
    const allowedOrigins = [
        'https://sponsor-db.com',
        'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        // In production, default to the main domain
        res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
            ? 'https://sponsor-db.com' 
            : 'http://localhost:3000');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'x-auth-token'); // Expose x-auth-token to the client
};

const corHeaders = (router) => {
    // Handle preflight requests
    router.options('*', (req, res) => {
        setCorsHeaders(req, res);
        res.status(200).end();
    });

    // Handle all other requests
    router.use((req, res, next) => {
        setCorsHeaders(req, res);
        next();
    });
};

module.exports = corHeaders;