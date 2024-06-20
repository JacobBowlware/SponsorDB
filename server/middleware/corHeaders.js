const setCorsHeaders = (res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'x-auth-token'); // Expose x-auth-token to the client
};

const corHeaders = (router) => {
    router.use((req, res, next) => {
        setCorsHeaders(res);
        next();
    });

};

module.exports = corHeaders;