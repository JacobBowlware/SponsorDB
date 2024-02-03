const mongoose = require('mongoose');
const Joi = require('joi');

const Sponsorship = mongoose.model('Sponsorship', new mongoose.Schema({
    sponsorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor',
        required: true
    },
    podcastName: { type: String, required: true },
    publishDate: { type: Date, required: true },
    tags: {
        type: [String],
        minlength: 1,
        maxlength: 256
    },
}));

const validateSponsorship = (sponsorship) => {
    const schema = Joi.object({
        sponsorId: Joi.string().min(2).max(256).required(),
        podcastName: Joi.string().min(2).max(256).required(),
        tags: Joi.array().items(Joi.string()).min(1).max(5),
        publishDate: Joi.date().required()
    });

    return schema.validate(sponsorship);
}

module.exports.Sponsorship = Sponsorship;
module.exports.validateSponsorship = validateSponsorship;