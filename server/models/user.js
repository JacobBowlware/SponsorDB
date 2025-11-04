const mongoose = require('mongoose');
const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');
const RefreshToken = require('./refreshToken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100,
        unique: true
    },
    password: {
        type: String,
        required: false,
        minlength: 2,
        maxlength: 100
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: false
    },
    picture: {
        type: String,
        required: false
    },
    stripeCustomerId: {
        type: String,
        required: false
    },
    subscription: {
        type: String,
        enum: ['premium', 'basic', 'none'],
        default: 'none'
    },
    trialStatus: {
        type: String,
        enum: ['active', 'expired', 'none'],
        default: 'none'
    },
    // Billing information from Stripe
    billing: {
        stripeSubscriptionId: {
            type: String,
            required: false
        },
        stripePriceId: {
            type: String,
            required: false
        },
        currentPeriodStart: {
            type: Date,
            required: false
        },
        currentPeriodEnd: {
            type: Date,
            required: false
        },
        cancelAtPeriodEnd: {
            type: Boolean,
            default: false
        },
        canceledAt: {
            type: Date,
            required: false
        },
        status: {
            type: String,
            enum: ['active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing'],
            default: 'incomplete'
        },
        monthlyCharge: {
            type: Number,
            required: false,
            default: 0
        },
        currency: {
            type: String,
            default: 'usd'
        },
        nextBillingDate: {
            type: Date,
            required: false
        },
        trialEnd: {
            type: Date,
            required: false
        }
    },
    isAdmin: {
        type: Boolean,
        required: false,
        default: false
    },
    newsletterOptIn: {
        type: Boolean,
        default: false
    },
    // New newsletter information
    newsletterInfo: {
        // Basic Info
        name: {
            type: String,
            required: false
        },
        topic: {
            type: String,
            required: false
        },
        audience_size: {
            type: Number,
            required: false,
            default: 0
        },
        engagement_rate: {
            type: Number,
            required: false,
            default: 0
        },
        publishing_frequency: {
            type: String,
            enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
            required: false
        },
        
        // Demographics
        audience_demographics: {
            age_range: {
                type: String,
                enum: ['18-25', '26-35', '36-45', '45+'],
                required: false
            },
            income_range: {
                type: String,
                enum: ['<50K', '50-100K', '100K+'],
                required: false
            },
            location: {
                type: String,
                enum: ['US', 'Europe', 'Global'],
                required: false
            },
            interests: [{
                type: String
            }],
            job_titles: [{
                type: String
            }]
        },
        
        // Experience & Preferences  
        sponsorship_history: {
            previous_sponsors: [{
                type: String
            }],
            typical_rates: {
                newsletter_mention: {
                    type: Number,
                    default: 0
                },
                dedicated_email: {
                    type: Number,
                    default: 0
                },
                banner_ad: {
                    type: Number,
                    default: 0
                }
            }
        },
        
        outreach_preferences: {
            style: {
                type: String,
                enum: ['professional', 'casual', 'personal'],
                required: false
            },
            follow_up_frequency: {
                type: String,
                enum: ['once', 'twice', 'three_times'],
                required: false
            },
            minimum_deal_size: {
                type: Number,
                default: 0
            }
        },
        
        // Generated insights (populated by AI)
        sponsor_match_profile: {
            ideal_sponsor_categories: [{
                type: String
            }],
            predicted_response_rate: {
                type: Number,
                default: 0
            },
            recommended_outreach_times: [{
                type: String
            }],
            personalization_data_points: [{
                type: String
            }]
        },
        
        // Analytics
        outreach_stats: {
            emails_sent: {
                type: Number,
                default: 0
            },
            responses_received: {
                type: Number,
                default: 0
            },
            deals_closed: {
                type: Number,
                default: 0
            },
            total_revenue: {
                type: Number,
                default: 0
            },
            average_response_rate: {
                type: Number,
                default: 0
            }
        }
    },
    
    // Track user's sponsor interactions
    sponsor_interactions: [{
        sponsor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sponsor'
        },
        interaction_type: {
            type: String,
            enum: ['viewed', 'contacted', 'responded', 'deal_closed']
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String
        },
        outcome: {
            type: String
        }
    }]
}, { timestamps: true });

// Generate access token (short-lived, 15 minutes)
userSchema.methods.generateAccessToken = function () {
    const token = jwt.sign(
        { _id: this._id }, 
        process.env.JWT_PRIVATE_KEY || config.get('JWT_PRIVATE_KEY'),
        { expiresIn: '15m' }
    );
    return token;
}

// Generate refresh token (long-lived, 30 days)
userSchema.methods.generateRefreshToken = async function (userAgent, ipAddress) {
    const tokenValue = RefreshToken.generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const refreshToken = new RefreshToken({
        token: tokenValue,
        userId: this._id,
        expiresAt: expiresAt,
        userAgent: userAgent,
        ipAddress: ipAddress
    });
    
    await refreshToken.save();
    return tokenValue;
}

// Generate both access and refresh tokens
userSchema.methods.generateAuthTokens = async function (userAgent, ipAddress) {
    const accessToken = this.generateAccessToken();
    const refreshToken = await this.generateRefreshToken(userAgent, ipAddress);
    
    return {
        accessToken,
        refreshToken
    };
}

// Legacy method for backward compatibility
userSchema.methods.generateAuthToken = function () {
    return this.generateAccessToken();
}

// Revoke all refresh tokens for this user
userSchema.methods.revokeAllRefreshTokens = async function () {
    return await RefreshToken.revokeAllForUser(this._id);
}

const User = mongoose.model('User', userSchema);

const validateUser = (user) => {
    const schema = Joi.object({
        email: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(2).max(100),
        googleId: Joi.string(),
        name: Joi.string(),
        picture: Joi.string(),
        stripeCustomerId: Joi.string(),
        subscription: Joi.string().valid('premium', 'basic', 'none'),
        trialStatus: Joi.string().valid('active', 'expired', 'none'),
        billing: Joi.object({
            stripeSubscriptionId: Joi.string(),
            stripePriceId: Joi.string(),
            currentPeriodStart: Joi.date(),
            currentPeriodEnd: Joi.date(),
            cancelAtPeriodEnd: Joi.boolean(),
            canceledAt: Joi.date(),
            status: Joi.string().valid('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'trialing'),
            monthlyCharge: Joi.number().min(0),
            currency: Joi.string(),
            nextBillingDate: Joi.date(),
            trialEnd: Joi.date()
        }),
        isAdmin: Joi.boolean(),
        newsletterOptIn: Joi.boolean(),
        newsletterInfo: Joi.object({
            name: Joi.string(),
            topic: Joi.string(),
            audience_size: Joi.number().min(0),
            engagement_rate: Joi.number().min(0).max(100),
            publishing_frequency: Joi.string().valid('daily', 'weekly', 'bi-weekly', 'monthly'),
            audience_demographics: Joi.object({
                age_range: Joi.string().valid('18-25', '26-35', '36-45', '45+'),
                income_range: Joi.string().valid('<50K', '50-100K', '100K+'),
                location: Joi.string().valid('US', 'Europe', 'Global'),
                interests: Joi.array().items(Joi.string()),
                job_titles: Joi.array().items(Joi.string())
            }),
            sponsorship_history: Joi.object({
                previous_sponsors: Joi.array().items(Joi.string()),
                typical_rates: Joi.object({
                    newsletter_mention: Joi.number().min(0),
                    dedicated_email: Joi.number().min(0),
                    banner_ad: Joi.number().min(0)
                })
            }),
            outreach_preferences: Joi.object({
                style: Joi.string().valid('professional', 'casual', 'personal'),
                follow_up_frequency: Joi.string().valid('once', 'twice', 'three_times'),
                minimum_deal_size: Joi.number().min(0)
            }),
            sponsor_match_profile: Joi.object({
                ideal_sponsor_categories: Joi.array().items(Joi.string()),
                predicted_response_rate: Joi.number().min(0).max(100),
                recommended_outreach_times: Joi.array().items(Joi.string()),
                personalization_data_points: Joi.array().items(Joi.string())
            }),
            outreach_stats: Joi.object({
                emails_sent: Joi.number().min(0),
                responses_received: Joi.number().min(0),
                deals_closed: Joi.number().min(0),
                total_revenue: Joi.number().min(0),
                average_response_rate: Joi.number().min(0).max(100)
            })
        }),
        sponsor_interactions: Joi.array().items(Joi.object({
            sponsor_id: Joi.string(),
            interaction_type: Joi.string().valid('viewed', 'contacted', 'responded', 'deal_closed'),
            date: Joi.date(),
            notes: Joi.string(),
            outcome: Joi.string()
        }))
    });

    return schema.validate(user);
}

module.exports.validateUser = validateUser;
module.exports.User = User;