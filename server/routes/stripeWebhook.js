const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const { User } = require('../models/user');

// Webhook endpoint for Stripe
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_KEY);

        // Handle subscription events
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const plan = session.metadata.plan;

            const user = await User.findById(userId);
            if (!user) {
                console.error("User not found:", userId);
                return res.status(404).send("User not found");
            }

            // Update user subscription status
            user.subscription = plan;
            user.stripeCustomerId = session.customer;
            user.purchased = true; // Keep for backward compatibility
            
            // Check if this is a trial subscription
            if (session.subscription && session.subscription.trial_end) {
                user.trialStatus = 'active';
                console.log(`User ${userId} started ${plan} plan trial`);
            } else {
                user.trialStatus = 'none';
                console.log(`User ${userId} subscribed to ${plan} plan`);
            }

            await user.save();
        }

        // Handle subscription updates
        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            const user = await User.findOne({ stripeCustomerId: customerId });
            if (user) {
                // Update subscription status based on Stripe subscription status
                if (subscription.status === 'active') {
                    user.subscription = subscription.metadata.plan || 'basic';
                } else if (subscription.status === 'trialing') {
                    // User is in trial period
                    user.subscription = subscription.metadata.plan || 'basic';
                    user.trialStatus = 'active';
                } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                    user.subscription = 'none';
                    user.trialStatus = 'expired';
                }
                await user.save();
            }
        }

        // Handle subscription cancellations
        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            const user = await User.findOne({ stripeCustomerId: customerId });
            if (user) {
                user.subscription = 'none';
                await user.save();
                console.log(`User ${user._id} subscription canceled`);
            }
        }

    } catch (err) {
        console.error("Webhook Error", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.status(200).send('Received');
});

module.exports = router;
