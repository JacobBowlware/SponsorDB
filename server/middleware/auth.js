const jwt = require('jsonwebtoken');
const config = require('config');
const { User } = require('../models/user');
const _ = require('lodash');

module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY || config.get('JWT_PRIVATE_KEY'));

        // Get user from the token, call database to get the user from their ID
        console.log(decoded);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(400).send('User not found.');
        }

        // If user is found, attach user info to the request object
        req.user = _.pick(user, ['_id', 'email', 'purchased', 'isAdmin']);

        // Call next middleware
        next();
    }
    catch (ex) {
        // Handle specific JWT errors
        if (ex.name === 'TokenExpiredError') {
            return res.status(401).send('Token expired. Please log in again.');
        } else if (ex.name === 'JsonWebTokenError') {
            return res.status(401).send('Invalid token. Please log in again.');
        } else {
            return res.status(400).send('Invalid token.');
        }
    }
};
