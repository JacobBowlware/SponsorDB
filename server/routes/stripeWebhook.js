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
                const previousSubscription = user.subscription;
                user.subscription = 'none';
                user.trialStatus = 'expired';
                await user.save();
                console.log(`User ${user._id} subscription canceled (was: ${previousSubscription})`);
            } else {
                console.log(`User not found for canceled subscription: ${customerId}`);
            }
        }

        // Handle invoice payment failed (subscription might be at risk)
        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object;
            const customerId = invoice.customer;

            const user = await User.findOne({ stripeCustomerId: customerId });
            if (user) {
                console.log(`Payment failed for user ${user._id}, subscription: ${user.subscription}`);
                // You might want to send an email notification here
            }
        }

        // Handle subscription paused (if using pause/resume feature)
        if (event.type === 'customer.subscription.paused') {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            const user = await User.findOne({ stripeCustomerId: customerId });
            if (user) {
                console.log(`User ${user._id} subscription paused`);
                // You might want to set a special status for paused subscriptions
            }
        }

        // Handle subscription resumed
        if (event.type === 'customer.subscription.resumed') {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            const user = await User.findOne({ stripeCustomerId: customerId });
            if (user) {
                user.subscription = subscription.metadata.plan || 'basic';
                await user.save();
                console.log(`User ${user._id} subscription resumed: ${user.subscription}`);
            }
        }

    } catch (err) {
        console.error("Webhook Error", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.status(200).send('Received');
});

// Debug endpoint to check webhook events (remove in production)
router.get('/debug', async (req, res) => {
    try {
        const { customerId } = req.query;
        
        if (!customerId) {
            return res.status(400).json({ error: 'customerId is required' });
        }

        // Get user from database
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get subscription from Stripe
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 10
        });

        res.json({
            user: {
                id: user._id,
                email: user.email,
                subscription: user.subscription,
                trialStatus: user.trialStatus,
                stripeCustomerId: user.stripeCustomerId
            },
            stripeSubscriptions: subscriptions.data.map(sub => ({
                id: sub.id,
                status: sub.status,
                current_period_start: new Date(sub.current_period_start * 1000),
                current_period_end: new Date(sub.current_period_end * 1000),
                cancel_at_period_end: sub.cancel_at_period_end,
                canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
                metadata: sub.metadata
            }))
        });
    } catch (error) {
        console.error('Debug webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
