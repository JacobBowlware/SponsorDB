const express = require('express');
const cors = require('cors');
const app = express();

// Configure CORS
const corsOptions = {
    origin: [
        'https://sponsor-db.com',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['x-auth-token'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

require('./startup/routes')(app);
require('./startup/db')();

module.exports = app;