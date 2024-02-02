const mongoose = require('mongoose');
const express = require('express');
const app = express();

require('./startup/routes')(app);

mongoose.connect('mongodb://localhost/sponsortrail')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));


const port = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log(`Listening on port ${port}...`);
});