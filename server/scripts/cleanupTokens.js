const mongoose = require('mongoose');
const config = require('config');
const RefreshToken = require('../models/refreshToken');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || config.get('MONGODB_URI'));
        console.log('MongoDB connected for token cleanup');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Cleanup expired refresh tokens
const cleanupExpiredTokens = async () => {
    try {
        console.log('Starting refresh token cleanup...');
        
        const result = await RefreshToken.cleanupExpired();
        
        console.log(`Cleanup completed. Removed ${result.deletedCount} expired refresh tokens.`);
        
        // Also clean up tokens that are very old (older than 60 days) even if not expired
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const oldTokensResult = await RefreshToken.deleteMany({
            createdAt: { $lt: sixtyDaysAgo }
        });
        
        console.log(`Also removed ${oldTokensResult.deletedCount} very old tokens (older than 60 days).`);
        
    } catch (error) {
        console.error('Error during token cleanup:', error);
    }
};

// Run cleanup if this script is executed directly
if (require.main === module) {
    connectDB().then(() => {
        cleanupExpiredTokens().then(() => {
            console.log('Token cleanup script completed');
            process.exit(0);
        });
    });
}

module.exports = { cleanupExpiredTokens };













