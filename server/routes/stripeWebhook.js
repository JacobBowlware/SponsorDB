const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const { User } = require('../models/user');

// Webhook endpoint for Stripe
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_KEY);

        // Get the user that the event is related to from stripe user id
        let user = await User.findOne({ stripeCustomerId: event.data.object.customer });

        // Data is verified and the event is valid, so we can store it in our database
        // and perform any actions required

        // Handle the checkout.session.completed event (for successful payments)
        if (event.type === 'checkout.session.completed') {
            const subscription = event.data.object;
            const tier = Number(subscription.metadata.tier);
            const userId = subscription.metadata.userId;

            const user = await User.findById(userId);

            if (!user) {
                console.error("User not found: ");
                return res.status(404).send("User not found");
            }

            let tierName = "Monthly";
            if (tier === 2) {
                tierName = "Yearly";
            }

            if (!user) {
                console.error("User not found: ");
                return res.status(404).send("User not found");
            }

            user.isSubscribed = true;
            user.subscriptionPlan = tierName;
            user.stripeCustomerId = subscription.customer;

            // If the subscription is yearly, set the currentPeriodEnd to 1 year from now
            if (tier === 2) {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 1);
                user.currentPeriodEnd = Math.floor(date.getTime() / 1000);
            }
            else {
                // Set the currentPeriodEnd to 1 month from now
                const date = new Date();
                date.setMonth(date.getMonth() + 1);
                user.currentPeriodEnd = Math.floor(date.getTime() / 1000);
            }

            await user.save();
        }

        // Handle the customer.subscription.deleted event (for cancelled subscriptions)
        if (event.type === 'customer.subscription.deleted') {
            if (!user) {
                return res.status(404).send("User not found");
            }

            user.isSubscribed = false;
            user.subscriptionPlan = "";
            user.currentPeriodEnd = 0;
            user.cancelAtPeriodEnd = false;

            await user.save();

            console.log("Subscription cancelled for user", user);
        }

        // Handle the customer.subscription.updated event (for subscription changes)
        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;

            if (!user) {
                console.error("User not found: ");
                return res.status(404).send("User not found");
            }

            if (subscription.cancel_at_period_end) {
                user.cancelAtPeriodEnd = true;
            }
            else {
                user.cancelAtPeriodEnd = false;
                user.subscriptionPlan = subscription.items.data[0].price.recurring.interval == 'year' ? 'Yearly' : 'Monthly';

                const endDate = new Date();
                // if plan is yearly, set the currentPeriodEnd to 1 year from now
                if (user.subscriptionPlan === 'Yearly') {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                }
                else {
                    // set the currentPeriodEnd to 1 month from now
                    endDate.setMonth(endDate.getMonth() + 1);
                }
                user.currentPeriodEnd = Math.floor(endDate.getTime() / 1000);
            }

            await user.save();

            console.log("Subscription updated for user", user);
        }

    } catch (err) {
        console.error("Webhook Error", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.status(200).send('Received');
});

module.exports = router;
