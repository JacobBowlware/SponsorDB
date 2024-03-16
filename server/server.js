const app = require('./app');
const config = require('config');
const winston = require('winston');

const setPort = config.get('port');
let port = process.env.PORT || setPort || 3000;
app.listen(port, () => {
    winston.info(`Listening on port ${port}...`);
});