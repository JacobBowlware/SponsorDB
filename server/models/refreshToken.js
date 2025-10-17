const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // MongoDB TTL index
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    userAgent: {
        type: String,
        maxlength: 500
    },
    ipAddress: {
        type: String,
        maxlength: 45 // IPv6 max length
    }
});

// Generate a secure random refresh token
refreshTokenSchema.statics.generateToken = function() {
    return crypto.randomBytes(64).toString('hex');
};

// Check if token is valid and not expired
refreshTokenSchema.methods.isValid = function() {
    return !this.isRevoked && this.expiresAt > new Date();
};

// Revoke the token
refreshTokenSchema.methods.revoke = function() {
    this.isRevoked = true;
    return this.save();
};

// Update last used timestamp
refreshTokenSchema.methods.updateLastUsed = function() {
    this.lastUsedAt = new Date();
    return this.save();
};

// Clean up expired tokens (static method)
refreshTokenSchema.statics.cleanupExpired = function() {
    return this.deleteMany({
        $or: [
            { expiresAt: { $lt: new Date() } },
            { isRevoked: true }
        ]
    });
};

// Revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = function(userId) {
    return this.updateMany(
        { userId: userId },
        { isRevoked: true }
    );
};

// Find valid token (token should be unique, so no need for userId)
refreshTokenSchema.statics.findValidToken = function(token) {
    return this.findOne({
        token: token,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
    });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);


