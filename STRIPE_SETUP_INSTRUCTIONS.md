# Stripe 14-Day Free Trial Setup Instructions

## ✅ What I've Implemented

1. **Added 14-day free trial** to your Stripe checkout session configuration
2. **Updated webhook handlers** to properly handle trial periods
3. **Added trialStatus field** to your User model
4. **Updated validation schemas** to include trial status

## 🔧 What You Need to Do

### 1. Get Your Price IDs from Stripe Dashboard

You currently have these product IDs:
- **Pro**: `prod_T5eEfZuKVANk0T`
- **Basic**: `prod_T5e9ud6gKvDrEU`

**You need to get the PRICE IDs for these products:**

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → Find your Basic and Pro products
3. Click on each product to see the **Pricing** section
4. Copy the **Price ID** (starts with `price_`) for each plan

### 2. Update Price IDs in Code

Once you have the price IDs, update them in `server/routes/users.js`:

```javascript
const priceIds = {
    basic: "price_YOUR_BASIC_PRICE_ID_HERE",    // Replace with actual Basic price ID
    pro: "price_YOUR_PRO_PRICE_ID_HERE"         // Replace with actual Pro price ID
};
```

### 3. Test the Implementation

1. **Start your server**: `cd server && npm start`
2. **Test the subscription flow**:
   - Go to your pricing page
   - Click on Basic or Pro plan
   - Complete the Stripe checkout
   - Verify that the trial period is set correctly

### 4. Verify Webhook Configuration

Make sure your Stripe webhook is configured to send these events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 🎯 How It Works

1. **User clicks subscribe** → Creates Stripe checkout session with `trial_period_days: 14`
2. **User completes checkout** → Webhook sets `trialStatus: 'active'` and `subscription: 'basic'/'pro'`
3. **During trial** → User has full access to the plan features
4. **After 14 days** → Stripe automatically charges the user and webhook updates status
5. **If trial expires without payment** → User loses access

## 🔍 Key Changes Made

### `server/routes/users.js`
- Added `trial_period_days: 14` to Stripe checkout session
- Added comments for price ID replacement

### `server/routes/stripeWebhook.js`
- Added trial status handling in webhook events
- Properly tracks trial vs active subscription states

### `server/models/user.js`
- Added `trialStatus` field with values: `'active'`, `'expired'`, `'none'`
- Updated validation schema

## 🚨 Important Notes

1. **Price IDs vs Product IDs**: You need **Price IDs** (starts with `price_`), not Product IDs
2. **Trial Period**: Users will be charged automatically after 14 days unless they cancel
3. **Webhook Security**: Make sure your webhook endpoint is secure and properly configured
4. **Testing**: Test with Stripe's test mode first before going live

## 🧪 Testing Checklist

- [ ] Get actual price IDs from Stripe Dashboard
- [ ] Update price IDs in code
- [ ] Test Basic plan subscription with trial
- [ ] Test Pro plan subscription with trial
- [ ] Verify webhook events are received
- [ ] Test trial expiration handling
- [ ] Test payment after trial period

## 📞 Need Help?

If you need help with any of these steps, just let me know! The most important thing is getting the correct price IDs from your Stripe Dashboard.




