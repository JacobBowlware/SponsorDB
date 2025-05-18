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
    }
})


const PotentialSponsor = mongoose.model('Potential Sponsor', potentialSponsorSchema);

const validatePotentialSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string(),
        tags: Joi.array().items(Joi.string().min(0).max(256)).max(5),
        newsletterSponsored: Joi.string().min(0).max(100),
        subscriberCount: Joi.number(),
        confidence: Joi.number(),
    }).options({ allowUnknown: true });

    return schema.validate(sponsor);
}

module.exports.PotentialSponsor = PotentialSponsor;
module.exports.validatePotentialSponsor = validatePotentialSponsor;