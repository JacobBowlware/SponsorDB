const Joi = require('joi');
const mongoose = require('mongoose');

const potentialSponsorSchema = new mongoose.Schema({
    emailSender: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256
    },
    potentialSponsorLinks: {
        type: [String],
        required: true,
        minlength: 1,
        maxlength: 100
    }
})


const PotentialSponsor = mongoose.model('Potential Sponsor', potentialSponsorSchema);

const validatePotentialSponsor = (sponsor) => {
    const schema = Joi.object({
        emailSender: Joi.string().min(2).max(256).required(),
        potentialSponsorLinks: Joi.array().items(Joi.string()).min(1).max(100)
    });

    return schema.validate(sponsor);
}

module.exports.PotentialSponsor = PotentialSponsor;
module.exports.validatePotentialSponsor = validatePotentialSponsor;