const { User, validateUser } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();
const auth = require('../middleware/auth');
const Token = require("../models/token");
const config = require("config");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const sendEmail = require("../utils/sendEmail");

require('../middleware/corHeaders')(router);

const monthlyStripePriceId = 'price_1QMvbJBKPgChhmNgBbSrkdc1';
const yearlyStripePriceId = 'price_1QMvawBKPgChhmNgmibqaDMT';

const monthlyStripePriceIdTest = 'price_1QCkC2BKPgChhmNgucfIFi7x';
const yearlyStripePriceIdTest = 'price_1QCk8DBKPgChhmNgF6h55ncY';

// Get current user
router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

// Get subscription info from the current user (from Stripe)
router.get('/customer-portal', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

    if (!user.stripeCustomerId) {
        return res.status(400).send("User has no subscription info");
    }

    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.CLIENT_URL}/profile`,
            metadata: {
                userId: user._id
            }
        });

        res.status(200).send({ url: session.url });
    }
    catch (error) {
        console.log("Error creating a billing portal session: ", error);
        return res.status(400).send("An error occured creating a billing portal session");
    }
});

// Register a new user
router.post('/', async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).send("Error occured registering new user: " + error.details[0].message);
    }

    let user = new User({
        email: req.body.email,
        password: "",
        isSubscribed: false // New users are not subscribed by default,

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

// Create a new user checkout session
router.post('/checkout', auth, async (req, res) => {
    const tier = req.body.tier;
    const userId = req.user._id;

    console.log("Creating checkout session for user: ", userId, " TIER: ", tier);

    if (req.body.isSubscribed) {
        // User is already subscribed, do nothing
        res.status(400).send("User is already subscribed");
    }
    else {
        try {
            let priceId;
            if (req.body.tier === 1) {
                priceId = monthlyStripePriceId;
            }
            else if (req.body.tier === 2) {
                priceId = yearlyStripePriceId;
            }
            else {
                return res.status(400).send("Invalid tier");
            }
            // convert userId to string
            let userIdToString = userId.toString();

            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1
                    },
                ],
                mode: 'subscription',
                success_url: `${process.env.CLIENT_URL}/sponsors`, // URL when payment is successful
                cancel_url: `${process.env.CLIENT_URL}/profile`,   // URL when payment fails/cancelled
                customer_email: req.user.email,  // Optional, to auto-fill Stripe customer info
                metadata: {
                    userId: userIdToString,
                    tier: tier
                }
            });

            res.status(200).send({ sessionId: session.id });
        }
        catch (error) {
            console.log("Error creating checkout session: ", error);
            return res.status(400).send("An error occured creating checkout session");
        }
    }
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