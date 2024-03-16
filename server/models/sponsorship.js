const mongoose = require('mongoose');
const Joi = require('joi');

const Sponsorship = mongoose.model('Sponsorship', new mongoose.Schema({
    sponsorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor',
        required: true
    },
    creatorName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 256
    },
    publishDate: {
        type: Date,
        required: true
    }
}));


const validateSponsorship = (sponsorship) => {
    const schema = Joi.object({
        sponsorId: Joi.string().min(2).max(256).required(),
        creatorName: Joi.string().min(2).max(256).required(),
        publishDate: Joi.date().required()
    });

    return schema.validate(sponsorship);
}

module.exports.Sponsorship = Sponsorship;
module.exports.validateSponsorship = validateSponsorship;