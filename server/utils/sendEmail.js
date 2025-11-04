const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text, html = null) => {
    try {
        // Create transporter using Zoho's SMTP server details
        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',         // Updated Zoho SMTP server
            port: 587,                     // TLS port for Zoho
            secure: false,                 // Use TLS instead of SSL
            auth: {
                user: 'info@sponsor-db.com', // Your Zoho email
                pass: process.env.sponsorDBEmailPassword, // Zoho email password or App password if 2FA enabled
            },
            tls: {
                rejectUnauthorized: false // Allow self-signed certificates
            }
        });

        // Verify connection configuration
        await transporter.verify();

        // Prepare email options
        const mailOptions = {
            from: 'info@sponsor-db.com',    // Sender address
            to: email,                    // Receiver email
            subject: subject,             // Email subject
            text: text,                   // Plain text email body
        };

        // Add HTML if provided
        if (html) {
            mailOptions.html = html;
        }

        // Send the email
        await transporter.sendMail(mailOptions);

        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Email not sent:", error);
        throw error; // Re-throw error so calling functions can handle it
    }
};

// Welcome email after signup/onboarding completion
const sendWelcomeEmail = async (user) => {
    const firstName = user.name ? user.name.split(' ')[0] : 'there';
    const dashboardLink = process.env.CLIENT_URL + '/sponsors';
    const text = `Hi ${firstName},

Thanks for signing up for SponsorDB. You now have access to our database of verified newsletter sponsors.

You have 14 days of free access. Your subscription will automatically start after the trial. Browse sponsors and start reaching out: ${dashboardLink}

Questions? Just reply to this email.

- SponsorDB Team`;

    await sendEmail(user.email, "Welcome to SponsorDB", text);
};

// Subscription started email after successful payment
const sendSubscriptionStartedEmail = async (user, subscription) => {
    const firstName = user.name ? user.name.split(' ')[0] : 'there';
    const planAmount = subscription.monthlyCharge || 20;
    const planName = 'premium';
    const nextBillingDate = subscription.nextBillingDate 
        ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
        })
        : 'Unknown';
    const stripePortalLink = process.env.CLIENT_URL + '/profile';

    const text = `Hi ${firstName},

Your subscription is now active. You're paying $${planAmount}/month for the ${planName} plan.

Next billing date: ${nextBillingDate}

Manage subscription: ${stripePortalLink}

Thanks for supporting SponsorDB.`;

    await sendEmail(user.email, "Your SponsorDB subscription is active", text);
};

// Trial ending reminder (3 days before trial ends - Day 11)
const sendTrialEndingEmail = async (user, trialEndDate) => {
    const firstName = user.name ? user.name.split(' ')[0] : 'there';
    const trialEndDateFormatted = new Date(trialEndDate).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
    const billingLink = process.env.CLIENT_URL + '/profile';

    const text = `Hi ${firstName},

Your 14-day trial ends on ${trialEndDateFormatted}. Your subscription will automatically start and your payment method will be charged.

Ensure your payment method is up to date: ${billingLink}

Questions? Reply to this email.`;

    await sendEmail(user.email, "Your SponsorDB trial ends in 3 days", text);
};

// Subscription cancelled email
const sendSubscriptionCancelledEmail = async (user, accessEndsDate) => {
    const firstName = user.name ? user.name.split(' ')[0] : 'there';
    const accessEndsDateFormatted = new Date(accessEndsDate).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });
    const resubscribeLink = process.env.CLIENT_URL + '/subscribe';
    const feedbackLink = `mailto:info@sponsor-db.com?subject=Why%20I%20Cancelled`;

    const text = `Hi ${firstName},

Your subscription has been cancelled. You'll still have access until ${accessEndsDateFormatted}.

Want to come back? Resubscribe anytime: ${resubscribeLink}

We'd love to know why you cancelled (optional): ${feedbackLink}

Thanks for trying SponsorDB.`;

    await sendEmail(user.email, "SponsorDB subscription cancelled", text);
};

// No engagement email (3 days after signup, still on trial, no applications)
const sendNoEngagementEmail = async (user, daysRemaining) => {
    const firstName = user.name ? user.name.split(' ')[0] : 'there';
    const dashboardLink = process.env.CLIENT_URL + '/sponsors';

    const text = `Hi ${firstName},

You signed up 3 days ago but haven't contacted any sponsors yet. Need help?

Browse sponsors: ${dashboardLink}
Questions? Just reply.

Your trial has ${daysRemaining} days left.`;

    await sendEmail(user.email, "Need help getting started with SponsorDB?", text);
};

// Newsletter subscription welcome email
const sendNewsletterWelcomeEmail = async (email, name = null) => {
    const firstName = name ? name.split(' ')[0] : 'there';
    const unsubscribeLink = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://sponsor-db.com') + '/unsubscribe?email=' + encodeURIComponent(email);

    const text = `Hi ${firstName},

Thanks for subscribing to the SponsorDB newsletter!

Every week, you'll receive our curated list of verified newsletter sponsors, along with insights and tips to help you connect with them.

We'll send you updates every Monday with fresh sponsor opportunities.

If you ever want to unsubscribe, you can do so here: ${unsubscribeLink}

Thanks for joining us!

- The SponsorDB Team`;

    await sendEmail(email, "Welcome to the SponsorDB Newsletter!", text);
};

module.exports = sendEmail;
module.exports.sendWelcomeEmail = sendWelcomeEmail;
module.exports.sendSubscriptionStartedEmail = sendSubscriptionStartedEmail;
module.exports.sendTrialEndingEmail = sendTrialEndingEmail;
module.exports.sendSubscriptionCancelledEmail = sendSubscriptionCancelledEmail;
module.exports.sendNoEngagementEmail = sendNoEngagementEmail;
module.exports.sendNewsletterWelcomeEmail = sendNewsletterWelcomeEmail;
