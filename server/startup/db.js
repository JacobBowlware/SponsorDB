const mongoose = require('mongoose');
const winston = require('winston');

module.exports = () => {
    mongoose.connect('mongodb://localhost/sponsortrail')
        .then(() => winston.info('Connected to MongoDB...'))
        .catch(err => winston.error('Could not connect to MongoDB...', err));
}