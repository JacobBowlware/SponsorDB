const Joi = require('joi');
const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    sponsors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SponsorNew',
        required: true
    }],
    subject: {
        type: String,
        required: true,
        maxlength: 500
    },
    customIntro: {
        type: String,
        required: false,
        maxlength: 5000
    },
    scheduledFor: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sent'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    sentAt: {
        type: Date
    },
    recipientCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    ctaIndex: {
        type: Number,
        required: false,
        min: 0,
        max: 4
    }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

const validateNewsletter = (newsletter) => {
    const schema = Joi.object({
        subject: Joi.string().max(500).required(),
        sponsors: Joi.array().items(Joi.string()).min(1).required(),
        customIntro: Joi.string().max(5000).allow(''),
        scheduledFor: Joi.date().allow(null),
        status: Joi.string().valid('draft', 'scheduled', 'sent'),
        recipientCount: Joi.number().min(0),
        sentAt: Joi.date().allow(null),
        createdBy: Joi.string().allow(null),
        ctaIndex: Joi.number().min(0).max(4).allow(null)
    });

    return schema.validate(newsletter);
}

module.exports = { Newsletter, validateNewsletter };

