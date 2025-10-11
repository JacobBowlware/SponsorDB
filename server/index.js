const express = require('express');
const cors = require('cors');
const app = express();

// Configure CORS
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://sponsor-db.com',
            'http://localhost:3000'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['x-auth-token']
};

// Apply CORS middleware
app.use(cors(corsOptions));

require('./startup/routes')(app);
require('./startup/db')();

module.exports = app;