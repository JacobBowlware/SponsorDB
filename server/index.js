require('express-async-errors');
const winston = require('winston');
require('winston-mongodb');
const express = require('express');
const app = express();
const config = require('config');

winston.add(new winston.transports.MongoDB({ db: 'mongodb://localhost/sponsortrail' }));

if (!config.get('openai_api_key') || !config.get('jwtPrivateKey')) {
    console.error('FATAL ERROR: key(s) are not defined.');
    process.exit(1);
}

require('./startup/routes')(app);
require('./startup/db')();

const port = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log(`Listening on port ${port}...`);
});