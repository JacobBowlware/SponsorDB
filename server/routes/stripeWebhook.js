const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const { User } = require('../models/user');

// Webhook endpoint for Stripe
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_KEY);

        // Handle the checkout.session.completed event (for successful payments)
        if (event.type === 'checkout.session.completed') {
            const purchase = event.data.object;
            const userId = purchase.metadata.userId;

            const user = await User.findById(userId);

            if (!user) {
                console.error("User not found: ");
                return res.status(404).send("User not found");
            }

            user.purchased = true;
            user.stripeCustomerId = purchase.customer;

            await user.save();
        }
    } catch (err) {
        console.error("Webhook Error", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    res.status(200).send('Received');
});

module.exports = router;
