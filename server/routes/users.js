const { User, validateUser } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const router = express.Router();
const auth = require('../middleware/auth');
const config = require("config");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

require('../middleware/corHeaders')(router);
const stripePriceIdTest = "";
const stripePriceId = "price_1QVLYrBKPgChhmNgw8nLtJrU";


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
        email: req.body.email.toLowerCase(),
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
    const userId = req.user._id;

    if (req.body.purchased) {
        // User is already subscribed, do nothing
        res.status(400).send("User is already subscribed");
    }
    else {
        try {
            // convert userId to string
            let userIdToString = userId.toString();

            // Create Stripe checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: stripePriceId,
                        quantity: 1
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}sponsors`, // URL when payment is successful
                cancel_url: `${process.env.CLIENT_URL}profile`,   // URL when payment fails/cancelled
                customer_email: req.user.email,  // Optional, to auto-fill Stripe customer info
                metadata: {
                    userId: userIdToString
                },
                allow_promotion_codes: true
            });

            res.status(200).send({ sessionId: session.id });
        }
        catch (error) {
            console.log("Error creating checkout session: ", error);
            return res.status(400).send("An error occured creating checkout session");
        }
    }
});

// Create a new user reset-password token and send session link to the user's email
router.post("/change-password", async (req, res) => {
    try {

        if (!req.body.email) return res.status(400).send("email is required");

        const user = await User.findOne({ email: req.body.email });
        if (!user)
            return res.status(400).send("user with given email doesn't exist");

        // Create a new token for user
        let token = user.generateAuthToken();

        const link = `${process.env.CLIENT_URL}/change-password-final?token=${token}`;
        const text = `Click on the link to reset your password: ${link}`;
        await sendEmail(user.email, "SponsorDB Password Reset Link", text);

        res.status(200).send("password reset link sent to your email account");
    } catch (error) {
        res.status(400).send("An error occured");
        console.log(error);
    }
});

// After the user clicks the password reset link in their email, they will be redirected to the frontend
// The frontend will then send a POST request to this endpoint with the new password, only if the token in the link is valid
router.post("/change-password-final/", async (req, res) => {
    try {
        const authToken = req.body.token;
        const newPassword = req.body.newPassword;

        if (!authToken || !newPassword) {
            return res.status(400).send("Invalid link");
        }

        // Decode the token
        const decoded = jwt.verify(authToken, process.env.JWT_PRIVATE_KEY || config.get('JWT_PRIVATE_KEY'));

        if (!decoded) {
            return res.status(400).send("Invalid token");
        }

        const userID = decoded._id;
        const user = await User.findById(userID);

        if (!user) {
            return res.status(400).send("Invalid userID");
        }

        // Update the user's password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).send("Password reset successfully");
    }
    catch (error) {
        console.log(error);
        res.status(400).send("An error occured resetting the password");
    }
});


router.post('/feedback/', async (req, res) => {
    try {
        const email = req.body.email;
        const name = req.body.name;
        const message = req.body.message;

        if (!email || !message) {
            return res.status(400).send("Email and message are required");
        }

        const text = `Email: ${email} \nName: ${name} \nMessage: ${message}`;
        await sendEmail("info@sponsor-db.com", "SponsorDB Feedback", text);

        res.status(200).send("Feedback sent successfully");
    }
    catch (error) {
        console.log(error);
        res.status(400).send("An error occured sending feedback");
    }
});


module.exports = router;