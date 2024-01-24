const mongoose = require('mongoose');

const Sponsorship = mongoose.model('Sponsorship', new mongoose.Schema({
    sponsor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor'
    },
    podcast: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Podcast'
    },
    date: { type: Date, default: Date.now }
}));

const validateSponsorship = (sponsorship) => {
    const schema = Joi.object({
        sponsor: Joi.string().min(2).max(256).required(),
        podcast: Joi.string().min(2).max(256).required(),
        date: Joi.date().required()
    });

    return schema.validate(sponsorship);
}

module.exports.Sponsorship = Sponsorship;
module.exports.validateSponsorship = validateSponsorship;