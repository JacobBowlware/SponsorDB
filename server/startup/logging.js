const winston = require('winston');
require('express-async-errors');
require('winston-mongodb');

module.exports = () => {
    winston.add(new winston.transports.MongoDB({ db: 'mongodb://localhost/sponsortrail' }));
    winston.add(new winston.transports.File({ filename: 'logfile.log' }));
    winston.add(new winston.transports.Console({ format: winston.format.simple() }));

    process.on('uncaughtException', (ex) => {
        winston.error(ex.message, ex);
        console.log('We got an uncaught exception');
        process.exit(1);
    });

    process.on('unhandledRejection', (ex) => {
        winston.error(ex.message, ex);
        process.exit(1);
    });
}