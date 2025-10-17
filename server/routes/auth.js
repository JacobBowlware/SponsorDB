const { User } = require('../models/user');
const { Token } = require('../models/token');
const RefreshToken = require('../models/refreshToken');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();
const Joi = require('joi');
const passport = require('passport');

require('../config/passport');

// Login with email/password
router.post('/login', async (req, res) => {
    const { error } = validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    let user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    try {
        // Generate both access and refresh tokens
        const tokens = await user.generateAuthTokens(
            req.get('User-Agent') || 'Unknown',
            req.ip || req.connection.remoteAddress
        );

        res.status(200).json({
            user: _.pick(user, ['_id', 'email']),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        console.error('Error generating tokens:', error);
        res.status(500).send('Internal server error');
    }
});

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        try {
            // Generate both access and refresh tokens
            const tokens = await req.user.generateAuthTokens(
                req.get('User-Agent') || 'Unknown',
                req.ip || req.connection.remoteAddress
            );
            
            const baseUrl = process.env.NODE_ENV === 'production' 
                ? 'https://sponsor-db.com'
                : 'http://localhost:3000';
                
            // Redirect to a special route that will handle storing the tokens
            res.redirect(`${baseUrl}/auth-callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
        } catch (error) {
            console.error('Error generating tokens for Google OAuth:', error);
            const baseUrl = process.env.NODE_ENV === 'production' 
                ? 'https://sponsor-db.com'
                : 'http://localhost:3000';
            res.redirect(`${baseUrl}/login?error=token_generation_failed`);
        }
    }
);

// Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
        // Find the refresh token in the database
        const storedToken = await RefreshToken.findValidToken(refreshToken);
        
        if (!storedToken) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Get the user
        const user = await User.findById(storedToken.userId);
        if (!user) {
            // Clean up orphaned refresh token
            await storedToken.revoke();
            return res.status(401).json({ error: 'User not found' });
        }

        // Update last used timestamp
        await storedToken.updateLastUsed();

        // Generate new access token
        const newAccessToken = user.generateAccessToken();

        res.json({
            accessToken: newAccessToken,
            refreshToken: refreshToken // Return the same refresh token
        });

    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout - revoke refresh token
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
        try {
            const storedToken = await RefreshToken.findOne({ token: refreshToken });
            if (storedToken) {
                await storedToken.revoke();
            }
        } catch (error) {
            console.error('Error revoking refresh token:', error);
        }
    }

    res.json({ message: 'Logged out successfully' });
});

// Logout from all devices - revoke all refresh tokens for user
router.post('/logout-all', async (req, res) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const config = require('config');
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY || config.get('JWT_PRIVATE_KEY'));
        
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Revoke all refresh tokens for this user
        await user.revokeAllRefreshTokens();

        res.json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        console.error('Error logging out from all devices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const validate = (req) => {
    const schema = Joi.object({
        email: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(2).max(100).required(),
    });

    return schema.validate(req);
}

module.exports = router;