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
    businessContact: {
        type: String,
        required: false
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
})


const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const validateSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().min(2).max(256),
        tags: Joi.array().items(Joi.string()).max(5),
        newsletterSponsored: Joi.string().max(1000),
        subscriberCount: Joi.number(),
        businessContact: Joi.string(),
        dateAdded: Joi.date()
    });

    return schema.validate(sponsor);
}

module.exports.Sponsor = Sponsor;
module.exports.validateSponsor = validateSponsor;