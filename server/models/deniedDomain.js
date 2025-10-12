const Joi = require('joi');
const mongoose = require('mongoose');

const deniedDomainSchema = new mongoose.Schema({
    rootDomain: {
        type: String,
        required: true,
        unique: true,
        minlength: 2,
        maxlength: 256,
        lowercase: true
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    dateAdded: {
        type: Date,
        default: Date.now
    },
    addedBy: {
        type: String,
        required: false,
        maxlength: 100
    }
});

const DeniedDomain = mongoose.model('DeniedDomain', deniedDomainSchema);

const validateDeniedDomain = (deniedDomain) => {
    const schema = Joi.object({
        rootDomain: Joi.string().min(2).max(256).required(),
        reason: Joi.string().max(500).required(),
        dateAdded: Joi.date(),
        addedBy: Joi.string().max(100)
    });

    return schema.validate(deniedDomain);
}

module.exports = { DeniedDomain, validateDeniedDomain };





