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
})


const PotentialSponsor = mongoose.model('Potential Sponsor', potentialSponsorSchema);

const validatePotentialSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().min(0).max(256),
        tags: Joi.array().items(Joi.string().min(0).max(256)).max(5),
        newsletterSponsored: Joi.string().min(0).max(100)
    });

    return schema.validate(sponsor);
}

module.exports.PotentialSponsor = PotentialSponsor;
module.exports.validatePotentialSponsor = validatePotentialSponsor;