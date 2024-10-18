const jwt = require('jsonwebtoken');
const config = require('config');
const { User } = require('../models/user');
const _ = require('lodash');

module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');

    console.log(token);
    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.jwtPrivateKey || config.get('jwtPrivateKey'));

        // Get user from the token, call database to get the user from their ID
        console.log(decoded);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(400).send('User not found.');
        }

        // If user is found, attach user info to the request object
        req.user = _.pick(user, ['_id', 'email', 'isAdmin']);

        // Call next middleware
        next();
    }
    catch (ex) {
        return res.status(400).send(ex, ex.message);
    }
};
