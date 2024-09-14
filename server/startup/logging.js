const winston = require('winston');
require('express-async-errors');
require('winston-mongodb');

const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} ${level}: ${stack || message}`;
    })
);

const mongoPassword = process.env.mongoPassword;
const mongoURI = "mongodb+srv://jacobbowlware:" + mongoPassword + "@sponsor-db.zsf5b.mongodb.net/?retryWrites=true&w=majority&appName=sponsor-db";

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'errorLogfile.log', level: 'error' }),
        new winston.transports.File({ filename: 'infoLogfile.log', level: 'info' }),
        new winston.transports.MongoDB({
            db: mongoURI,
            level: 'info'
        })
    ]
});

process.on('uncaughtException', (ex) => {
    logger.error(ex.message, ex);
    process.exit(1);
});

process.on('unhandledRejection', (ex) => {
    logger.error(ex.message);
    process.exit(1);
});

module.exports = logger;