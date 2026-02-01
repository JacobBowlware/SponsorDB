# Subscription to One-Time Payment Migration Guide

This document outlines all changes made to convert the SaaS subscription model to a one-time payment model.

## Summary of Changes

### ✅ Completed Changes

1. **Stripe Checkout Session** - Changed from `subscription` mode to `payment` mode
2. **Webhook Handlers** - Updated to handle one-time payment events
3. **Pricing UI Components** - Updated all pricing displays to show one-time payment
4. **Copy Updates** - Changed "Subscribe" to "Purchase/Buy Now" throughout
5. **Database Logic** - Reusing `isSubscribed` attribute (no schema changes needed)

---

## Files Modified

### Backend Files

#### 1. `server/routes/users.js`

**Changes:**
- ✅ Updated checkout session creation to use `mode: 'payment'` instead of `mode: 'subscription'`
- ✅ Removed `subscription_data` and `trial_period_days` (not needed for one-time payments)
- ✅ Updated webhook handler `handleCheckoutSessionCompleted` to detect payment vs subscription mode
- ✅ Updated error message from "already subscribed" to "already purchased"

**Stripe Price ID Locations:**
- **Line 13-14**: Add your one-time payment Price IDs
  ```javascript
  const stripePriceIdTest = ""; // {/* STRIPE_PRICE_ID_HERE */} - Test mode one-time payment price ID
  const stripePriceId = ""; // {/* STRIPE_PRICE_ID_HERE */} - Production one-time payment price ID
  ```
- **Line 297**: Price ID is used in checkout session creation

**Note:** Subscription cancellation endpoints (`/subscription/cancel`, `/subscription/reactivate`) still exist but are only for legacy subscriptions during migration. New one-time payments don't use these.

#### 2. `server/routes/stripeWebhook.js`

**Changes:**
- ✅ Updated `checkout.session.completed` handler to detect `session.mode === 'payment'` for one-time payments
- ✅ For one-time payments: Sets `user.subscription = plan`, `user.purchased = true`, grants lifetime access
- ✅ Removed subscription-specific billing fields for one-time payments (no `stripeSubscriptionId`, no `nextBillingDate`)
- ✅ Added comments marking subscription handlers as "legacy" for backward compatibility

**Webhook Events Handled:**
- ✅ `checkout.session.completed` - **PRIMARY EVENT** for one-time payments
  - Checks `session.mode === 'payment'` to identify one-time payments
  - Sets user access immediately upon payment completion
- ⚠️ `customer.subscription.*` events - Legacy only (for existing subscriptions during migration)

---

### Frontend Files

#### 3. `client/SponsorTrail/src/pages/Home.tsx`

**Changes:**
- ✅ Pricing section: Changed from "$20/month" to "$199 one-time"
- ✅ Updated heading: "Start your 14-day free trial" → "Get Lifetime Access"
- ✅ Updated button: "Start Free Trial" → "Buy Now"
- ✅ Updated copy: "Cancel anytime" → "One-time payment · Lifetime access"
- ✅ Updated feature description: "Your subscription gets more valuable" → "Your lifetime access gets more valuable"

#### 4. `client/SponsorTrail/src/pages/Subscribe.tsx`

**Changes:**
- ✅ Updated heading: "Start your 14-day free trial" → "Get Lifetime Access"
- ✅ Updated pricing: "$20/month" → "$199 one-time"
- ✅ Updated button: "Start Free Trial" → "Buy Now"
- ✅ Removed trial end date calculation and display
- ✅ Updated trust indicators: "Cancel anytime" → "Lifetime access"
- ✅ Updated analytics tracking: `subscribe_selected` → `purchase_selected`

#### 5. `client/SponsorTrail/src/components/PricingCard.tsx`

**Changes:**
- ✅ Badge: "2 Week Free Trial" → "Lifetime Access"
- ✅ Price display: Removed "/month" and "/year", added "one-time"
- ✅ Button: "Start Free Trial" → "Buy Now"
- ✅ Footer: "Card required • Cancel anytime" → "One-time payment • Lifetime access"

#### 6. `client/SponsorTrail/src/components/Pricing.tsx`

**Changes:**
- ✅ Heading: "Choose Your Plan" → "Get Lifetime Access"
- ✅ Badge: "14-day free trial included" → "One-time payment, lifetime access"
- ✅ Simplified to single pricing card (removed Basic/Pro tiers)
- ✅ Updated price to "$199" with "one-time" label

#### 7. `client/SponsorTrail/src/components/SignupFlow.tsx`

**Changes:**
- ✅ Step 2 heading: "Start your 14-day free trial" → "Get Lifetime Access"
- ✅ Removed trial info message
- ✅ Updated pricing card: "$20/month" → "$199 one-time"
- ✅ Updated features: Removed "2-week free trial" and "Cancel anytime", added "Lifetime access" and "New sponsors added weekly"
- ✅ Button: "Start Free Trial" → "Buy Now"
- ✅ Footer: Removed trial charge date, added "One-time payment · Lifetime access"
- ✅ Analytics: `subscription_selected` → `purchase_selected`

#### 8. `client/SponsorTrail/src/pages/authReq/Sponsors.tsx`

**Changes:**
- ✅ Updated purchase button text: "Subscribe to Pro - $79/mo" → "Purchase Lifetime Access - $199"

#### 9. `client/SponsorTrail/src/pages/authReq/Purchase.tsx`

**Changes:**
- ✅ Removed `plan: 'pro'` parameter from checkout API call (not needed for one-time payments)

---

## Stripe Configuration Required

### 1. Create One-Time Payment Products in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Create a new Product:
   - Name: "SponsorDB Lifetime Access" (or similar)
   - Pricing: One-time payment
   - Price: $199.00 (or your desired amount)
3. Copy the **Price ID** (starts with `price_...`)

### 2. Update Price IDs in Code

**File: `server/routes/users.js`**

Replace the placeholder Price IDs on lines 13-14:

```javascript
// Test mode (for development)
const stripePriceIdTest = "price_YOUR_TEST_PRICE_ID_HERE";

// Production mode
const stripePriceId = "price_YOUR_PRODUCTION_PRICE_ID_HERE";
```

### 3. Configure Stripe Webhook

Your existing webhook endpoint will work, but ensure it's listening for:

**Required Event:**
- ✅ `checkout.session.completed` - This is the primary event for one-time payments

**Optional (Legacy):**
- `customer.subscription.*` - Only needed if you have existing subscriptions to migrate

**Webhook Endpoint:**
- Your webhook is already configured at: `server/routes/stripeWebhook.js` and `server/routes/users.js` (both handle the same endpoint)

---

## Database Schema

**No schema changes required!**

The existing `isSubscribed` attribute (which checks `user.subscription !== 'none'`) is reused for one-time purchases. The webhook sets:
- `user.subscription = 'premium'` (or your plan name)
- `user.purchased = true`
- `user.billing.status = 'active'`

**Note:** For one-time payments, `billing.stripeSubscriptionId` will be `null` since there's no subscription object.

---

## Testing Checklist

### Before Going Live

- [ ] Add Stripe Price IDs to `server/routes/users.js`
- [ ] Test checkout flow in Stripe Test Mode
- [ ] Verify webhook receives `checkout.session.completed` event
- [ ] Verify user access is granted immediately after payment
- [ ] Test payment success redirect
- [ ] Test payment cancellation redirect
- [ ] Verify no subscription-related UI elements remain

### Test Scenarios

1. **New User Purchase:**
   - User signs up → Clicks "Buy Now" → Completes payment → Should have immediate access

2. **Existing User (Already Purchased):**
   - User with `subscription !== 'none'` should be redirected away from purchase pages

3. **Payment Cancellation:**
   - User clicks "Buy Now" → Cancels in Stripe → Should return to subscribe page

4. **Webhook Processing:**
   - Complete a test payment → Check webhook logs → Verify user record updated correctly

---

## Migration Notes

### For Existing Subscriptions

If you have existing active subscriptions:

1. **Option 1: Grandfather Existing Users**
   - Keep subscription webhook handlers active
   - Existing subscribers continue on subscription model
   - New users use one-time payment model

2. **Option 2: Migrate All Users**
   - Contact existing subscribers to offer lifetime access upgrade
   - Cancel their subscriptions in Stripe
   - Grant lifetime access manually or via admin tool

### Backward Compatibility

The code maintains backward compatibility:
- Webhook handlers check `session.mode` to determine payment vs subscription
- Subscription-related endpoints still exist but won't be used for new purchases
- Existing subscription users will continue to work until their subscriptions end

---

## Important Notes

1. **Price IDs:** You MUST add your Stripe Price IDs before going live. The code will fail if Price IDs are empty.

2. **Webhook Events:** One-time payments only trigger `checkout.session.completed`. No subscription events are fired.

3. **No Recurring Billing:** One-time payments don't have:
   - Trial periods
   - Recurring charges
   - Subscription cancellation
   - Billing cycles
   - Renewal dates

4. **Access Duration:** Users with `user.subscription !== 'none'` have lifetime access. No expiration dates.

5. **Refunds:** Handle refunds manually through Stripe Dashboard. Consider adding a refund webhook handler if needed.

---

## Support

If you encounter issues:

1. Check Stripe Dashboard → Webhooks → View event logs
2. Check server logs for webhook processing errors
3. Verify Price IDs are correctly set in `server/routes/users.js`
4. Ensure webhook endpoint is accessible and properly configured in Stripe

---

## Summary of Key Changes

| Component | Before | After |
|----------|--------|-------|
| **Stripe Mode** | `subscription` | `payment` |
| **Price** | $20/month | $199 one-time |
| **Trial Period** | 14 days | None |
| **Button Text** | "Start Free Trial" | "Buy Now" |
| **Access Model** | Recurring subscription | Lifetime access |
| **Webhook Event** | `checkout.session.completed` + subscription events | `checkout.session.completed` only |
| **Database Check** | `user.subscription !== 'none'` | Same (reused) |

---

**Migration completed!** 🎉

Remember to add your Stripe Price IDs before going live!

