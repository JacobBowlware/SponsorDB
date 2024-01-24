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
        minlength: 5,
        maxlength: 512,
    },
    tags: {
        type: [String],
        required: true,
        minlength: 1,
        maxlength: 256
    }
})

const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const validateSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().min(5).max(512),
        tags: Joi.array().items(Joi.string()).min(1).max(256).required()
    });

    return schema.validate(sponsor);
}

module.exports.Sponsor = Sponsor;
module.exports.validateSponsor = validateSponsor;