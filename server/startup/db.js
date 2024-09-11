const mongoose = require('mongoose');
const config = require('config');
const logger = require('./logging');

module.exports = () => {
    mongoose.connect(config.get('db'), {
        useUnifiedTopology: true,
    })
        .then(() => logger.info(`Connected to ${config.get('db')}...`))
        .catch(err => logger.error('Could not connect to MongoDB...', err));
}