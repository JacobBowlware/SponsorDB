const Joi = require('joi');
const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema({
    sponsorName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256
    },
    sponsorLink: {
        type: String,
        required: false,
        minlength: 0,
        maxlength: 256
    },
    rootDomain: {
        type: String,
        required: false,
        minlength: 0,
        maxlength: 256
    },
    tags: {
        type: [String],
        required: false,
        minlength: 0,
        maxlength: 5
    },
    newsletterSponsored: {
        type: String,
        required: false,
        minlength: 0,
        maxlength: 1000
    },
    subscriberCount: {
        type: Number,
        required: false
    },
    sponsorEmail: {
        type: String,
        required: false
    },
    sponsorApplication: {
        type: String,
        required: false
    },
    businessContact: {
        type: String,
        required: false,
        maxlength: 500
    },
    contactMethod: {
        type: String,
        enum: ['email', 'application', 'both', 'none'],
        default: 'none'
    },
    status: {
        type: String,
        enum: ['pending', 'approved'],
        default: 'pending'
    },
    dateAdded: {
        type: Date,
        default: Date.now
    },
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    appliedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    userViewDates: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        dateViewed: {
            type: Date,
            default: Date.now
        }
    }],
    userApplyDates: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        dateApplied: {
            type: Date,
            default: Date.now
        }
    }],
    // Affiliate program fields
    isAffiliateProgram: {
        type: Boolean,
        default: false
    },
    affiliateSignupLink: {
        type: String,
        required: false,
        maxlength: 500
    },
    commissionInfo: {
        type: String,
        required: false,
        maxlength: 500
    },
    interestedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const validateSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().min(0).max(256).allow(''),
        rootDomain: Joi.string().max(256).allow(''),
        tags: Joi.array().items(Joi.string()).max(5),
        newsletterSponsored: Joi.string().max(1000).allow(''),
        subscriberCount: Joi.number(),
        sponsorEmail: Joi.string().allow(''),
        sponsorApplication: Joi.string().allow(''),
        businessContact: Joi.string().max(500).allow(''),
        contactMethod: Joi.string().valid('email', 'application', 'both', 'none'),
        status: Joi.string().valid('pending', 'approved'),
        dateAdded: Joi.date(),
        viewedBy: Joi.array().items(Joi.string()),
        appliedBy: Joi.array().items(Joi.string()),
        userViewDates: Joi.array().items(Joi.object({
            user: Joi.string().required(),
            dateViewed: Joi.date().default(Date.now)
        })),
        userApplyDates: Joi.array().items(Joi.object({
            user: Joi.string().required(),
            dateApplied: Joi.date().default(Date.now)
        })),
        isAffiliateProgram: Joi.boolean().default(false),
        affiliateSignupLink: Joi.string().max(500).allow(''),
        commissionInfo: Joi.string().max(500).allow(''),
        interestedUsers: Joi.array().items(Joi.string())
    });

    return schema.validate(sponsor);
}

module.exports = { Sponsor, validateSponsor };