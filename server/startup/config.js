const config = require('config');

module.exports = () => {
    if (!config.get('openai_api_key') || !config.get('jwtPrivateKey')) {
        console.error('FATAL ERROR: key(s) are not defined.');
        process.exit(1);
    }
}