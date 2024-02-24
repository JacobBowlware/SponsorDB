const mongoose = require('mongoose');

module.exports = () => {
    mongoose.connect('mongodb://localhost/sponsortrail')
        .then(() => console.log('Connected to MongoDB...'))
        .catch(err => console.error('Could not connect to MongoDB...', err));
}