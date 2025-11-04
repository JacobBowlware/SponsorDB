const Joi = require('joi');
const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    source: {
        type: String,
        enum: ['homepage', 'signup', 'manual'],
        default: 'homepage'
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);

const validateNewsletterSubscriber = (subscriber) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        source: Joi.string().valid('homepage', 'signup', 'manual')
    });

    return schema.validate(subscriber);
}

module.exports = { NewsletterSubscriber, validateNewsletterSubscriber };

