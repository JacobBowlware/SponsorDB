const mongoose = require('mongoose');

const Sponsorship = new mongoose.model('Sponsorship', new mongoose.Schema({
    podcastName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    sponsorName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    website: {
        type: String,
        required: false,
        minlength: 2,
        maxlength: 100
    },
}));

module.exports = Sponsorship;