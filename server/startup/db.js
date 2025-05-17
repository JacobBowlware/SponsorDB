// startup/db.js
const mongoose = require('mongoose');
const logger = require('./logging');

// Read the full connection string from one env var
const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error('Missing MONGO_URI environment variable');
}

module.exports = () => {
  mongoose.connect(uri, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB…'))
  .catch(err => logger.error('Could not connect to MongoDB', err));
};
