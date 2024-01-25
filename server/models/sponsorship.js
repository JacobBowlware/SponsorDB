const mongoose = require('mongoose');

const Sponsorship = mongoose.model('Sponsorship', new mongoose.Schema({
    sponsorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor'
    },
    podcastId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Podcast'
    },
    date: { type: Date, default: Date.now }
}));

const validateSponsorship = (sponsorship) => {
    const schema = Joi.object({
        sponsorId: Joi.string().min(2).max(256).required(),
        podcastId: Joi.string().min(2).max(256).required(),
        date: Joi.date().required()
    });

    return schema.validate(sponsorship);
}

module.exports.Sponsorship = Sponsorship;
module.exports.validateSponsorship = validateSponsorship;