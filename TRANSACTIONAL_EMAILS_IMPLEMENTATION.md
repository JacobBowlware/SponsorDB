# Transactional Emails Implementation

## Overview
Implemented 5 transactional emails for user lifecycle events using the existing Zoho SMTP email infrastructure.

## Email Templates

### 1. Welcome Email
- **Trigger**: After user signup (POST /users)
- **Subject**: "Welcome to SponsorDB"
- **Recipients**: New users
- **Content**: Welcome message with trial info and dashboard link

### 2. Subscription Started Email
- **Trigger**: After successful payment (subscription.updated webhook: trialing → active)
- **Subject**: "Your SponsorDB subscription is active"
- **Recipients**: Users who just paid after trial
- **Content**: Confirmation with plan details, billing date, and manage subscription link

### 3. Trial Ending Reminder
- **Trigger**: Scheduled job (runs daily)
- **Subject**: "Your SponsorDB trial ends in 3 days"
- **Recipients**: Users on day 11 of 14-day trial
- **Content**: Reminder with billing link to add payment method

### 4. Subscription Cancelled Email
- **Trigger**: Stripe webhook (customer.subscription.deleted)
- **Subject**: "SponsorDB subscription cancelled"
- **Recipients**: Users who cancelled subscription
- **Content**: Confirmation with access end date, resubscribe link, and feedback link

### 5. No Engagement Email
- **Trigger**: Scheduled job (runs daily)
- **Subject**: "Need help getting started with SponsorDB?"
- **Recipients**: Users who signed up 3 days ago with 0 sponsor applications
- **Content**: Helpful reminder with dashboard link and days remaining

## Implementation Details

### Files Modified

#### 1. `server/utils/sendEmail.js`
- Extended existing email utility with 5 new email functions:
  - `sendWelcomeEmail(user)`
  - `sendSubscriptionStartedEmail(user, subscription)`
  - `sendTrialEndingEmail(user, trialEndDate)`
  - `sendSubscriptionCancelledEmail(user, accessEndsDate)`
  - `sendNoEngagementEmail(user, daysRemaining)`

#### 2. `server/routes/users.js`
- Added welcome email trigger after user creation (line 215)
- Imported `sendWelcomeEmail` function

#### 3. `server/routes/stripeWebhook.js`
- Added subscription started email when transitioning from trial to active
- Added subscription cancelled email when subscription is deleted
- Improved billing info tracking

#### 4. `server/models/user.js`
- Added `{ timestamps: true }` to schema for tracking user creation date

#### 5. `server/scripts/sendLifecycleEmails.js` (NEW)
- Created scheduled job for trial ending reminders
- Created scheduled job for no engagement emails
- Runs daily to check eligible users

#### 6. `server/server.js`
- Integrated lifecycle email jobs into server startup
- Runs daily at 9 AM (via setInterval)
- Initial run 2 minutes after server start

## Email Service Configuration

Uses existing Zoho SMTP setup:
- Host: smtppro.zoho.com
- Port: 465 (SSL)
- From: info@sponsor-db.com
- Password: From environment variable `sponsorDBEmailPassword`

## Scheduled Jobs

The lifecycle email jobs run daily and:
1. Check for users whose trials end in 3 days (day 11 of trial)
2. Check for users who signed up 3 days ago with 0 applications

## Testing

To test the implementation:
1. **Welcome Email**: Sign up a new user
2. **Trial Ending**: Wait for users to reach day 11 of trial (or manually set billing.trialEnd date)
3. **No Engagement**: Sign up user and wait 3 days without creating any applications
4. **Subscription Started**: Subscribe to the service (after trial)
5. **Subscription Cancelled**: Cancel an active subscription via Stripe

## Notes

- All emails use plain text format (no HTML)
- Uses user's first name from `user.name` field, defaults to "there" if not available
- Error handling is in place to prevent email failures from breaking other operations
- Daily job checks for eligibility rather than sending on exact day (flexibility for missed runs)
- Subscription started email only sends when transitioning from trial to paid, not at checkout

## Environment Variables Required

- `CLIENT_URL`: Used in email links (e.g., https://sponsor-db.com)
- `sponsorDBEmailPassword`: Zoho email password







