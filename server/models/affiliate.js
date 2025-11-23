const Joi = require('joi');
const mongoose = require('mongoose');

// Schema for affiliated newsletter entry
const affiliatedNewsletterSchema = new mongoose.Schema({
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
    dateAffiliated: {
        type: Date,
        default: Date.now
    },
    emailAddress: {
        type: String,
        required: false,
        maxlength: 500
    }
}, { _id: false });

const affiliateSchema = new mongoose.Schema({
    affiliateName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256
    },
    affiliateLink: {
        type: String,
        required: true,
        maxlength: 500
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
    // Array of affiliated newsletters
    affiliatedNewsletters: {
        type: [affiliatedNewsletterSchema],
        required: false,
        default: []
    },
    commissionInfo: {
        type: String,
        required: false,
        maxlength: 500
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
    interestedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const Affiliate = mongoose.model('Affiliate', affiliateSchema);

const validateAffiliate = (affiliate) => {
    const schema = Joi.object({
        affiliateName: Joi.string().min(2).max(256).required(),
        affiliateLink: Joi.string().max(500).required(),
        rootDomain: Joi.string().max(256).allow(''),
        tags: Joi.array().items(Joi.string()).max(10),
        affiliatedNewsletters: Joi.array().items(Joi.object({
            newsletterName: Joi.string().min(2).max(256).required(),
            estimatedAudience: Joi.number().min(0),
            contentTags: Joi.array().items(Joi.string()),
            dateAffiliated: Joi.date(),
            emailAddress: Joi.string().max(500).allow('')
        })),
        commissionInfo: Joi.string().max(500).allow(''),
        status: Joi.string().valid('pending', 'approved'),
        dateAdded: Joi.date(),
        interestedUsers: Joi.array().items(Joi.string())
    });

    return schema.validate(affiliate);
}

module.exports = { Affiliate, validateAffiliate };

