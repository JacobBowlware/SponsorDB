const Joi = require('joi');
const mongoose = require('mongoose');

const deniedSponsorLinkSchema = new mongoose.Schema({
    rootDomain: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256,
        unique: true
    },
    dateDenied: {
        type: Date,
        default: Date.now
    },
    deniedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: {
        type: String,
        required: false,
        maxlength: 500
    }
});

const DeniedSponsorLink = mongoose.model('Denied Sponsor Link', deniedSponsorLinkSchema);

const validateDeniedSponsorLink = (deniedLink) => {
    const schema = Joi.object({
        rootDomain: Joi.string().min(2).max(256).required(),
        dateDenied: Joi.date(),
        deniedBy: Joi.string(),
        reason: Joi.string().max(500)
    });

    return schema.validate(deniedLink);
}

module.exports = { DeniedSponsorLink, validateDeniedSponsorLink }; 