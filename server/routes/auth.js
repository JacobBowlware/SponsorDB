const { User } = require('../models/user');
const { Token } = require('../models/token');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();
const Joi = require('joi');
const passport = require('passport');

require('../middleware/corHeaders')(router);
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

    const token = user.generateAuthToken();

    res.header('x-auth-token', token).status(200).send(_.pick(user, ['_id', 'email']))
});

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        const token = req.user.generateAuthToken();
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://sponsor-db.com'
            : 'http://localhost:3000';
            
        // Redirect to a special route that will handle storing the token
        res.redirect(`${baseUrl}/auth-callback?token=${token}`);
    }
);

const validate = (req) => {
    const schema = Joi.object({
        email: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(2).max(100).required(),
    });

    return schema.validate(req);
}

module.exports = router;