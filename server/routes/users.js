const { User, validateUser } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();
const auth = require('../middleware/auth');
const Token = require("../models/token");
const config = require("config");
const sendEmail = require("../utils/sendEmail");

require('../middleware/corHeaders')(router);

// Get current user
router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

// Test route
router.get('/test', async (req, res) => {
    res.send("Testing...");
});

// Register a new user
router.post('/', async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).send("Error Happen: " + error.details[0].message);
    }

    let user = new User({
        email: req.body.email,
        password: ""
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    try {
        await user.save();
    }
    catch (error) {
        return res.status(400).send("A user with this email already exists");
    }

    const token = user.generateAuthToken();
    res.header('x-auth-token', token);
    res.status(200).send(_.pick(user, ['_id', 'email']));
});

router.post("/reset-password", async (req, res) => {
    try {

        if (!req.body.email) return res.status(400).send("email is required");

        const user = await User.findOne({ email: req.body.email });
        if (!user)
            return res.status(400).send("user with given email doesn't exist");

        // Check if token already exists, if not then create a new one
        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = user.generateAuthToken();
        }

        const link = `${config.get('BASE_URL')}/password-reset/${user._id}/${token.token}`;
        await sendEmail(user.email, "Password reset", link);

        res.status(200).send("password reset link sent to your email account");
    } catch (error) {
        res.status(400).send("An error occured");
        console.log(error);
    }
});

router.post("/:userId/:token", async (req, res) => {
    try {
        const schema = Joi.object({ password: Joi.string().required() });
        const { error } = schema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const user = await User.findById(req.params.userId);
        if (!user) return res.status(400).send("invalid link or expired");

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!token) return res.status(400).send("Invalid link or expired");

        user.password = req.body.password;
        await user.save();
        await token.delete();

        res.send("password reset sucessfully.");
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

module.exports = router;