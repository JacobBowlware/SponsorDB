const express = require('express');
const app = express();
const corHeaders = require('./middleware/corHeaders');

// Apply CORS middleware at the application level
corHeaders(app);

require('./startup/routes')(app);
require('./startup/db')();

module.exports = app;