const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const { User } = require('../models/user');

// Webhook endpoint for Stripe
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_KEY);

        // Data is verified and the event is valid, so we can store it in our database
        // and perform any actions required
        if (event.type === 'checkout.session.completed') {
            const subscription = event.data.object;
            const userId = subscription.metadata.userId;
            const tier = subscription.metadata.tier;

            let tierName = "Monthly";
            if (tier === 2) {
                tierName = "Yearly";
            }

            const user = await User.findById(userId);
            if (!user) {
                console.error("User not found: ", userId);
                return res.status(404).send("User not found");
            }

            user.isSubscribed = true;
            user.subscriptionPlan = tierName;
            user.currentPeriodEnd = subscription.expires_at;
            user.stripeCustomerId = subscription.customer;

            console.log(subscription);
            await user.save();

            console.log("Subscription created for user", user);

        }
    } catch (err) {
        console.error("Webhook Error", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.status(200).send('Received');
});

module.exports = router;
