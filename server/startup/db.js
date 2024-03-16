const mongoose = require('mongoose');
const winston = require('winston');
const config = require('config');

module.exports = () => {
    mongoose.connect(config.get('db'), {
        useUnifiedTopology: true,
    })
        .then(() => winston.info(`Connected to ${config.get('db')}...`))
        .catch(err => winston.error('Could not connect to MongoDB...', err));
}