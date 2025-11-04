const { User } = require('../models/user');
const { UserApplication } = require('../models/userApplication');
const sendTrialEndingEmail = require('../utils/sendEmail').sendTrialEndingEmail;
const sendNoEngagementEmail = require('../utils/sendEmail').sendNoEngagementEmail;
const logger = require('../startup/logging');

/**
 * Send trial ending reminder emails (3 days before trial ends - Day 11)
 * Users on day 11 of their trial get a reminder email
 */
async function sendTrialEndingReminders() {
    try {
        logger.info('Starting trial ending reminder email job');
        
        // Calculate the date 3 days from now
        const in3Days = new Date();
        in3Days.setDate(in3Days.getDate() + 3);
        
        // Find users whose trial ends in exactly 3 days (Day 11 of 14-day trial)
        // Trial is active and ends in 3 days
        const users = await User.find({
            trialStatus: 'active',
            'billing.trialEnd': {
                $gte: new Date(in3Days.getTime() - 12 * 60 * 60 * 1000), // Start of day
                $lt: new Date(in3Days.getTime() + 12 * 60 * 60 * 1000)      // End of day
            }
        });
        
        logger.info(`Found ${users.length} users with trials ending in 3 days`);
        
        for (const user of users) {
            try {
                await sendTrialEndingEmail(user, user.billing.trialEnd);
                logger.info(`Sent trial ending email to user ${user._id} (${user.email})`);
            } catch (error) {
                logger.error(`Error sending trial ending email to user ${user._id}:`, error);
            }
        }
        
        logger.info(`Trial ending reminder email job completed. Sent ${users.length} emails.`);
    } catch (error) {
        logger.error('Error in trial ending reminder job:', error);
    }
}

/**
 * Send no-engagement emails to users who signed up 3 days ago and haven't contacted any sponsors
 * Users signed up 3 days ago with no user applications
 */
async function sendNoEngagementReminders() {
    try {
        logger.info('Starting no-engagement reminder email job');
        
        // Calculate the date 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);
        
        const threeDaysAgoEnd = new Date(threeDaysAgo);
        threeDaysAgoEnd.setHours(23, 59, 59, 999);
        
        // Find users who created their account 3 days ago
        const users = await User.find({
            createdAt: {
                $gte: threeDaysAgo,
                $lte: threeDaysAgoEnd
            },
            trialStatus: { $in: ['active', 'none'] } // Still on trial or no subscription
        });
        
        logger.info(`Found ${users.length} users who signed up 3 days ago`);
        
        let emailsSent = 0;
        
        for (const user of users) {
            try {
                // Check if user has any sponsor applications
                const applicationCount = await UserApplication.countDocuments({
                    userId: user._id
                });
                
                // If no applications, send the no-engagement email
                if (applicationCount === 0) {
                    // Calculate days remaining in trial
                    let daysRemaining = 14;
                    if (user.billing && user.billing.trialEnd) {
                        const trialEnd = new Date(user.billing.trialEnd);
                        const now = new Date();
                        const diffTime = trialEnd - now;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        daysRemaining = diffDays > 0 ? diffDays : 0;
                    }
                    
                    await sendNoEngagementEmail(user, daysRemaining);
                    logger.info(`Sent no-engagement email to user ${user._id} (${user.email})`);
                    emailsSent++;
                }
            } catch (error) {
                logger.error(`Error sending no-engagement email to user ${user._id}:`, error);
            }
        }
        
        logger.info(`No-engagement reminder email job completed. Sent ${emailsSent} emails.`);
    } catch (error) {
        logger.error('Error in no-engagement reminder job:', error);
    }
}

/**
 * Run both email lifecycle jobs
 */
async function runLifecycleEmailJobs() {
    await sendTrialEndingReminders();
    await sendNoEngagementReminders();
}

module.exports = {
    sendTrialEndingReminders,
    sendNoEngagementReminders,
    runLifecycleEmailJobs
};

