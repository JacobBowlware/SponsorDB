const Joi = require('joi');
const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema({
    sponsorName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256,
        unique: true
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
    linkedVideos: {
        type: [String],
        required: false,
        minlength: 0,
        maxlength: 1000
    }
})


const Sponsor = mongoose.model('Sponsor', sponsorSchema);

const validateSponsor = (sponsor) => {
    const schema = Joi.object({
        sponsorName: Joi.string().min(2).max(256).required(),
        sponsorLink: Joi.string().min(2).max(256),
        tags: Joi.array().items(Joi.string()).max(5)
    });

    return schema.validate(sponsor);
}

module.exports.Sponsor = Sponsor;
module.exports.validateSponsor = validateSponsor;