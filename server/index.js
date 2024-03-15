const express = require('express');
const winston = require('winston');
const app = express();
const config = require('config');

require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();

const otherPort = config.get('port');
const port = process.env.PORT || otherPort || 3000;
const server = app.listen(port, () => {
    winston.info(`Listening on port ${port}...`);
});

module.exports = server;