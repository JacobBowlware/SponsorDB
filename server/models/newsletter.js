const Joi = require('joi');
const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    sponsors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor',
        required: true
    }],
    subject: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent'],
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
    }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

const validateNewsletter = (newsletter) => {
    const schema = Joi.object({
        subject: Joi.string().max(500).required(),
        sponsors: Joi.array().items(Joi.string()).min(1).required(),
        status: Joi.string().valid('draft', 'sent'),
        recipientCount: Joi.number().min(0),
        sentAt: Joi.date()
    });

    return schema.validate(newsletter);
}

module.exports = { Newsletter, validateNewsletter };

