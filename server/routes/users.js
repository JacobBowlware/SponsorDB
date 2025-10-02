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
const stripePriceId = "price_1RS2RRBKPgChhmNgHhLwtLzP"; 

router.get('/test', (req, res) => {
    res.send("Test route, it works!");
}
);

// Get current user with complete billing information
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        // If user has a Stripe customer ID, fetch billing information
        if (user.stripeCustomerId) {
            try {
                // Get customer from Stripe
                const customer = await stripe.customers.retrieve(user.stripeCustomerId);
                
                // Get active subscriptions
                const subscriptions = await stripe.subscriptions.list({
                    customer: user.stripeCustomerId,
                    status: 'all',
                    limit: 1
                });
                
                if (subscriptions.data.length > 0) {
                    const subscription = subscriptions.data[0];
                    const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
                    
                    // Update user billing information
                    user.billing = {
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items.data[0].price.id,
                        currentPeriodStart: new Date(subscription.current_period_start * 1000),
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
                        status: subscription.status,
                        monthlyCharge: price.unit_amount / 100, // Convert from cents
                        currency: price.currency,
                        nextBillingDate: new Date(subscription.current_period_end * 1000),
                        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
                    };
                    
                    // Update subscription status based on Stripe
                    if (subscription.status === 'active') {
                        user.subscription = subscription.metadata.plan || 'basic';
                        user.trialStatus = 'none';
                    } else if (subscription.status === 'trialing') {
                        user.subscription = subscription.metadata.plan || 'basic';
                        user.trialStatus = 'active';
                    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                        user.subscription = 'none';
                        user.trialStatus = 'expired';
                    }
                    
                    // Save updated user
                    await user.save();
                } else {
                    // No active subscription found
                    user.subscription = 'none';
                    user.trialStatus = 'none';
                    if (user.billing) {
                        user.billing.status = 'canceled';
                    }
                    await user.save();
                }
            } catch (stripeError) {
                console.error('Error fetching Stripe data:', stripeError);
                // Continue with existing user data if Stripe fails
            }
        }
        
        res.send(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Error fetching user data');
    }
});

// Get newsletter info for current user
router.get('/newsletter-info', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('newsletterInfo');
        res.json(user.newsletterInfo);
    } catch (error) {
        console.error('Error fetching newsletter info:', error);
        res.status(400).send('Error fetching newsletter info');
    }
});

// Migration route to fix existing users with empty newsletter info objects
router.post('/migrate-newsletter-info', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Check if newsletterInfo is an empty object and convert to null
        if (user.newsletterInfo && typeof user.newsletterInfo === 'object' && Object.keys(user.newsletterInfo).length === 0) {
            user.newsletterInfo = null;
            await user.save();
            res.json({ message: 'Newsletter info migrated successfully', newsletterInfo: null });
        } else {
            res.json({ message: 'No migration needed', newsletterInfo: user.newsletterInfo });
        }
    } catch (error) {
        console.error('Error migrating newsletter info:', error);
        res.status(400).send('Error migrating newsletter info');
    }
});

// Update newsletter info for current user
router.put('/newsletter-info', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Clean the request body to remove undefined values
        const cleanedBody = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (value !== undefined) {
                cleanedBody[key] = value;
            }
        }

        // Update newsletter info
        user.newsletterInfo = {
            ...user.newsletterInfo,
            ...cleanedBody
        };

        await user.save();
        res.json(user.newsletterInfo);
    } catch (error) {
        console.error('Error updating newsletter info:', error);
        res.status(400).send('Error updating newsletter info');
    }
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
        subscription: 'none', // New users start with no subscription
        billing: {
            status: 'incomplete'
        },
        newsletterInfo: req.body.newsletterInfo || null
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

// Create a new user checkout session for subscription
router.post('/checkout', auth, async (req, res) => {
    const userId = req.user._id;
    const { plan } = req.body;

    // Check if user is already subscribed
    const user = await User.findById(userId);
    if (user.subscription && user.subscription !== 'none') {
        return res.status(400).send("User is already subscribed");
    }

    if (!plan || !['basic', 'pro'].includes(plan)) {
        return res.status(400).send("Valid plan (basic or pro) is required");
    }

    try {
        // Define price IDs for different plans
        const priceIds = {
            basic: "price_1S9SrBBKPgChhmNgfcwDLsFP", // Basic plan price ID
            pro: "price_1S9SwKBKPgChhmNgOZeG1SwC"    // Pro plan price ID
        };

        const priceId = priceIds[plan];
        if (!priceId) {
            return res.status(400).send("Invalid plan selected");
        }

        // Create or get Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    userId: userId.toString()
                }
            });
            customerId = customer.id;
            
            // Update user with customer ID
            user.stripeCustomerId = customerId;
            await user.save();
        }

        // Create Stripe checkout session for subscription
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/subscribe`,
            customer: customerId,
            metadata: {
                userId: userId.toString(),
                plan: plan
            },
            allow_promotion_codes: true,
            subscription_data: {
                metadata: {
                    userId: userId.toString(),
                    plan: plan
                },
                // Add 14-day free trial
                trial_period_days: 14
            }
        });

        res.status(200).send({ sessionId: session.id });
    }
    catch (error) {
        console.log("Error creating checkout session: ", error);
        return res.status(400).send("An error occured creating checkout session");
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

// Get user's subscription details
router.get('/subscription', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user.billing || !user.billing.stripeSubscriptionId) {
            return res.status(404).send("No subscription found");
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(user.billing.stripeSubscriptionId);
        
        res.json({
            subscription: user.subscription,
            billing: user.billing,
            stripeSubscription: {
                id: subscription.id,
                status: subscription.status,
                current_period_start: subscription.current_period_start,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end: subscription.cancel_at_period_end,
                canceled_at: subscription.canceled_at
            }
        });
    } catch (error) {
        console.log("Error fetching subscription details:", error);
        res.status(400).send("Error fetching subscription details");
    }
});

// Cancel subscription
router.post('/subscription/cancel', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user.billing || !user.billing.stripeSubscriptionId) {
            return res.status(404).send("No active subscription found");
        }

        // Cancel subscription at period end
        const subscription = await stripe.subscriptions.update(
            user.billing.stripeSubscriptionId,
            { cancel_at_period_end: true }
        );

        // Update user billing info
        user.billing.cancelAtPeriodEnd = true;
        await user.save();

        res.json({
            message: "Subscription will be canceled at the end of the current period",
            subscription: subscription
        });
    } catch (error) {
        console.log("Error canceling subscription:", error);
        res.status(400).send("Error canceling subscription");
    }
});

// Reactivate subscription
router.post('/subscription/reactivate', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user.billing || !user.billing.stripeSubscriptionId) {
            return res.status(404).send("No subscription found");
        }

        // Reactivate subscription
        const subscription = await stripe.subscriptions.update(
            user.billing.stripeSubscriptionId,
            { cancel_at_period_end: false }
        );

        // Update user billing info
        user.billing.cancelAtPeriodEnd = false;
        await user.save();

        res.json({
            message: "Subscription reactivated successfully",
            subscription: subscription
        });
    } catch (error) {
        console.log("Error reactivating subscription:", error);
        res.status(400).send("Error reactivating subscription");
    }
});

// Stripe webhook handler for subscription events
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object);
            break;
        case 'customer.subscription.created':
            await handleSubscriptionCreated(event.data.object);
            break;
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object);
            break;
        case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object);
            break;
        case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(event.data.object);
            break;
        case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// Helper functions for webhook events
async function handleCheckoutSessionCompleted(session) {
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;
    
    if (userId && plan) {
        const user = await User.findById(userId);
        if (user) {
            user.subscription = plan;
            user.billing = {
                ...user.billing,
                status: 'active',
                stripeSubscriptionId: session.subscription,
                stripePriceId: session.line_items.data[0].price.id,
                currentPeriodStart: new Date(session.subscription_details.current_period_start * 1000),
                currentPeriodEnd: new Date(session.subscription_details.current_period_end * 1000),
                nextBillingDate: new Date(session.subscription_details.current_period_end * 1000)
            };
            await user.save();
        }
    }
}

async function handleSubscriptionCreated(subscription) {
    const customerId = subscription.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        user.subscription = subscription.metadata.plan || 'pro';
        user.billing = {
            ...user.billing,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            nextBillingDate: new Date(subscription.current_period_end * 1000),
            monthlyCharge: subscription.items.data[0].price.unit_amount / 100
        };
        await user.save();
    }
}

async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        user.billing = {
            ...user.billing,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            nextBillingDate: new Date(subscription.current_period_end * 1000)
        };
        await user.save();
    }
}

async function handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        user.subscription = 'none';
        user.billing = {
            ...user.billing,
            status: 'canceled',
            canceledAt: new Date(subscription.canceled_at * 1000)
        };
        await user.save();
    }
}

async function handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        user.billing = {
            ...user.billing,
            status: 'active',
            nextBillingDate: new Date(invoice.period_end * 1000)
        };
        await user.save();
    }
}

async function handlePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ stripeCustomerId: customerId });
    
    if (user) {
        user.billing = {
            ...user.billing,
            status: 'past_due'
        };
        await user.save();
    }
}

// Debug route to check subscription status
router.get('/debug-subscription', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user.stripeCustomerId) {
            return res.json({
                error: 'No Stripe customer ID found',
                user: {
                    id: user._id,
                    email: user.email,
                    subscription: user.subscription,
                    trialStatus: user.trialStatus,
                    stripeCustomerId: user.stripeCustomerId
                }
            });
        }
        
        // Get customer from Stripe
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        
        // Get all subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'all',
            limit: 10
        });
        
        // Get price information for each subscription
        const subscriptionsWithPrices = await Promise.all(
            subscriptions.data.map(async (sub) => {
                const price = await stripe.prices.retrieve(sub.items.data[0].price.id);
                return {
                    id: sub.id,
                    status: sub.status,
                    current_period_start: new Date(sub.current_period_start * 1000),
                    current_period_end: new Date(sub.current_period_end * 1000),
                    cancel_at_period_end: sub.cancel_at_period_end,
                    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
                    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
                    metadata: sub.metadata,
                    price: {
                        id: price.id,
                        unit_amount: price.unit_amount,
                        currency: price.currency,
                        recurring: price.recurring
                    }
                };
            })
        );
        
        res.json({
            user: {
                id: user._id,
                email: user.email,
                subscription: user.subscription,
                trialStatus: user.trialStatus,
                stripeCustomerId: user.stripeCustomerId,
                billing: user.billing
            },
            stripeCustomer: {
                id: customer.id,
                email: customer.email,
                created: new Date(customer.created * 1000)
            },
            subscriptions: subscriptionsWithPrices
        });
    } catch (error) {
        console.error('Debug subscription error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;