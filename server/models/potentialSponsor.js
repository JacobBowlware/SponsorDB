const Joi = require('joi');
const mongoose = require('mongoose');

const potentialSponsorSchema = new mongoose.Schema({
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
    confidence: {
        type: Number,
        default: 0
    },
    // Enriched fields from GPT analysis
    businessContact: {
        type: String,
        required: false
    },
    contactMethod: {
        type: String,
        enum: ['email', 'partner-page', 'media-kit', 'none'],
        default: 'none'
    },
    estimatedSubscribers: {
        type: Number,
        required: false
    },
    subscriberReasoning: {
        type: String,
        required: false
    },
    enrichmentNotes: {
        type: String,
        required: false
    },
    analysisStatus: {
        type: String,
        enum: ['complete', 'manual_review_required', 'pending'],
        default: 'complete'
    },
    sponsorshipEvidence: {
        type: String,
        required: false
    },
    dateAdded: {
        type: Date,
        default: Date.now
    },
    lastAnalyzed: {
        type: Date,
        default: Date.now
    }
})

const PotentialSponsor = mongoose.model('Potential Sponsor', potentialSponsorSchema);

const validatePotentialSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string(),
        rootDomain: Joi.string().max(256),
        tags: Joi.array().items(Joi.string().min(0).max(256)).max(5),
        newsletterSponsored: Joi.string().min(0).max(100),
        subscriberCount: Joi.number(),
        confidence: Joi.number(),
        businessContact: Joi.string(),
        contactMethod: Joi.string().valid('email', 'partner-page', 'media-kit', 'none'),
        estimatedSubscribers: Joi.number(),
        subscriberReasoning: Joi.string(),
        enrichmentNotes: Joi.string(),
        analysisStatus: Joi.string().valid('complete', 'manual_review_required', 'pending'),
        sponsorshipEvidence: Joi.string(),
        dateAdded: Joi.date(),
        lastAnalyzed: Joi.date()
    }).options({ allowUnknown: true });

    return schema.validate(sponsor);
}

module.exports = { PotentialSponsor, validatePotentialSponsor };