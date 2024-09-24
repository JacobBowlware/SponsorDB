const app = require('./index.js');
const config = require('config');
const logger = require('./startup/logging');

/*
TODO:
- Add an error logger for the email monitor - DONE
- Add unit & integration tests for the email monitor
- Change email monitor CRON job to run every 12 hours.
- 
*/

// Check for JWT private key
if (!process.env.jwtPrivateKey) {
    logger.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

const setPort = config.get('port');
let port = process.env.PORT || setPort || 4000;
app.listen(port, () => {
    logger.info(`Listening on port ${port}...`);
});