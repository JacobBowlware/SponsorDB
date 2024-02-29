const express = require('express');
const app = express();

require('./startup/logging')();
require('./startup/config')();
require('./startup/routes')(app);
require('./startup/db')();

const port = process.env.PORT || 3000;

app.listen(3000, () => {
    console.log(`Listening on port ${port}...`);
});