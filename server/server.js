const app = require('./index.js');
const config = require('config');
const logger = require('./startup/logging');
const { cleanupExpiredTokens } = require('./scripts/cleanupTokens');
const { runLifecycleEmailJobs } = require('./scripts/sendLifecycleEmails');

/*
TODO:
- Add an error logger for the email monitor - DONE
- Add unit & integration tests for the email monitor
- Change email monitor CRON job to run every 12 hours.
- 
*/

// Check for JWT private key
if (!process.env.JWT_PRIVATE_KEY) {
    logger.error('FATAL ERROR: JWT_PRIVATE_KEY is not defined.');
    process.exit(1);
}

const port = process.env.PORT || 3001;
app.listen(port, () => {
    logger.info(`Listening on port ${port}...`);
    
    // Schedule token cleanup to run every 24 hours
    setInterval(async () => {
        try {
            await cleanupExpiredTokens();
        } catch (error) {
            logger.error('Error during scheduled token cleanup:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Schedule lifecycle emails to run daily at 9 AM
    setInterval(async () => {
        try {
            await runLifecycleEmailJobs();
        } catch (error) {
            logger.error('Error during lifecycle email job:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Run initial cleanup after 1 minute (to allow DB connection to establish)
    setTimeout(async () => {
        try {
            await cleanupExpiredTokens();
        } catch (error) {
            logger.error('Error during initial token cleanup:', error);
        }
    }, 60 * 1000); // 1 minute
    
    // Run lifecycle email jobs initially after 2 minutes
    setTimeout(async () => {
        try {
            await runLifecycleEmailJobs();
        } catch (error) {
            logger.error('Error during initial lifecycle email job:', error);
        }
    }, 2 * 60 * 1000); // 2 minutes
});