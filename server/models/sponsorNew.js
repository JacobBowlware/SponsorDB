const Joi = require('joi');
const mongoose = require('mongoose');

// Schema for newsletter sponsorship entry
const newsletterSponsoredSchema = new mongoose.Schema({
    newsletterName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256
    },
    estimatedAudience: {
        type: Number,
        required: false
    },
    contentTags: {
        type: [String],
        required: false,
        default: []
    },
    dateSponsored: {
        type: Date,
        default: Date.now
    },
    emailAddress: {
        type: String,
        required: false,
        maxlength: 500
    }
}, { _id: false });

const sponsorNewSchema = new mongoose.Schema({
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
        maxlength: 256,
        index: true
    },
    tags: {
        type: [String],
        required: false,
        minlength: 0,
        maxlength: 10
    },
    // Array of newsletter sponsorships
    newslettersSponsored: {
        type: [newsletterSponsoredSchema],
        required: false,
        default: []
    },
    // Contact information - ONLY email addresses now
    sponsorEmail: {
        type: String,
        required: false,
        maxlength: 500
    },
    businessContact: {
        type: String,
        required: false,
        maxlength: 500
    },
    contactMethod: {
        type: String,
        enum: ['email', 'none'],
        default: 'none'
    },
    // Detailed contact info from Gemini analysis
    contactPersonName: {
        type: String,
        required: false,
        maxlength: 256
    },
    contactPersonTitle: {
        type: String,
        required: false,
        maxlength: 256
    },
    contactType: {
        type: String,
        enum: ['named_person', 'business_email', 'generic_email', 'not_found'],
        required: false
    },
    confidence: {
        type: Number,
        required: false,
        min: 0,
        max: 1
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
    }]
});

const SponsorNew = mongoose.model('SponsorNew', sponsorNewSchema);

const validateSponsorNew = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().min(0).max(256).allow(''),
        rootDomain: Joi.string().max(256).allow(''),
        tags: Joi.array().items(Joi.string()).max(10),
        newslettersSponsored: Joi.array().items(Joi.object({
            newsletterName: Joi.string().min(2).max(256).required(),
            estimatedAudience: Joi.number().min(0),
            contentTags: Joi.array().items(Joi.string()),
            dateSponsored: Joi.date(),
            emailAddress: Joi.string().max(500).allow('')
        })),
        sponsorEmail: Joi.string().max(500).allow(''),
        businessContact: Joi.string().max(500).allow(''),
        contactMethod: Joi.string().valid('email', 'none'),
        contactPersonName: Joi.string().max(256).allow(''),
        contactPersonTitle: Joi.string().max(256).allow(''),
        contactType: Joi.string().valid('named_person', 'business_email', 'generic_email', 'not_found').allow(''),
        confidence: Joi.number().min(0).max(1).allow(null),
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
        }))
    });

    return schema.validate(sponsor);
}

module.exports = { SponsorNew, validateSponsorNew };

