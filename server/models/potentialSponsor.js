const Joi = require('joi');
const mongoose = require('mongoose');

const potentialSponsorSchema = new mongoose.Schema({
    emailSender: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256
    },
    sponsorLink: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        required: true,
        maxlength: 10
    }
})


const PotentialSponsor = mongoose.model('Potential Sponsor', potentialSponsorSchema);

const validatePotentialSponsor = (sponsor) => {
    const schema = Joi.object({
        emailSender: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().required(),
        tags: Joi.array().items(Joi.string()).max(10).required()
    });

    return schema.validate(sponsor);
}

module.exports.PotentialSponsor = PotentialSponsor;
module.exports.validatePotentialSponsor = validatePotentialSponsor;