const app = require('./index.js');
const config = require('config');
const winston = require('winston');

// Check for JWT private key
if (!config.get('jwtPrivateKey')) {
    winston.error('FATAL ERROR: jwtPrivateKey is not defined.');
    process.exit(1);
}

const setPort = config.get('port');
let port = process.env.PORT || setPort || 4000;
app.listen(port, () => {
    winston.info(`Listening on port ${port}...`);
});