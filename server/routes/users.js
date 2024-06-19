const { User, validateUser } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();
const auth = require('../middleware/auth');

require('../middleware/corHeaders')(router);

// Get current user
router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

// Register a new user
router.post('/', async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    let user = await User.findOne({ email: req.body.email });
    if (user) {
        return res.status(400).send('User already registered.');
    }

    user = new User({
        email: req.body.email,
        password: ""
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    await user.save();

    const token = user.generateAuthToken();
    res.header('x-auth-token', token);
    res.status(200).send(_.pick(user, ['_id', 'email']));
});

module.exports = router;