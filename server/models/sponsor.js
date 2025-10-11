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
    contactMethod: {
        type: String,
        enum: ['email', 'application', 'both', 'none'],
        default: 'none'
    },
    analysisStatus: {
        type: String,
        enum: ['complete', 'manual_review_required', 'pending'],
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
    }]
})

const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const validateSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().min(0).max(256),
        rootDomain: Joi.string().max(256),
        tags: Joi.array().items(Joi.string()).max(5),
        newsletterSponsored: Joi.string().max(1000),
        subscriberCount: Joi.number(),
        sponsorEmail: Joi.string(),
        sponsorApplication: Joi.string(),
        contactMethod: Joi.string().valid('email', 'application', 'both', 'none'),
        analysisStatus: Joi.string().valid('complete', 'manual_review_required', 'pending'),
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
        }))
    });

    return schema.validate(sponsor);
}

module.exports = { Sponsor, validateSponsor };