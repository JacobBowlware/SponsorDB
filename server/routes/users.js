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

const monthlyStripePriceId = 'price_1QCSZqBKPgChhmNgGnhuNBuz';
const yearlyStripePriceId = 'price_1QCSb5BKPgChhmNg7mtS0pJj';

const monthlyStripePriceIdTest = 'price_1QCkC2BKPgChhmNgucfIFi7x';
const yearlyStripePriceIdTest = 'price_1QCk8DBKPgChhmNgF6h55ncY';

// Get current user
router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.send(user);
});

// Get subscription info from the current user (from Stripe)
router.get('/subscriptionInfo', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

    if (!user.stripeCustomerId) {
        return res.status(400).send("User has no subscription info");
    }

    try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        // log customer
        console.log("Customer Info: ", customer);

        // List subscriptions for the customer
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
        });

        // Check if customer has subscriptions
        if (subscriptions.data.length === 0) {
            return res.status(400).send("No subscriptions found for this customer.");
        }

        // Retrieve the first subscription (or whichever is relevant)
        const subscription = subscriptions.data[0];
        console.log("Subscription Info: ", subscription);

        // Send the subscription info as the response
        res.status(200).send(subscription).select('-');
    }
    catch (error) {
        console.log("Error fetching subscription info: ", error);
        return res.status(400).send("An error occured fetching subscription info");
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

router.post('/checkout', auth, async (req, res) => {
    const tier = req.body.tier;
    const userId = req.user._id;

    if (req.body.isSubscribed) {
        // User is already subscribed, do nothing
        res.status(400).send("User is already subscribed");
    }
    else {
        try {
            let priceId;
            if (req.body.tier === 1) {
                priceId = monthlyStripePriceIdTest;
            }
            else if (req.body.tier === 2) {
                priceId = yearlyStripePriceIdTest;
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
                success_url: `${process.env.CLIENT_URL}/payment-success`, // URL when payment is successful
                cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,   // URL when payment fails/cancelled
                customer_email: req.user.email,  // Optional, to auto-fill Stripe customer info
                metadata: {
                    userId: userIdToString,
                    tier: tier
                }
            });

            res.status(200).send({ sessionId: session.id });
        }
        catch (error) {
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