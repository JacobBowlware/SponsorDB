const mongoose = require('mongoose');

const express = require('express');
const app = express();

mongoose.connect('mongodb://localhost/sponsortrail')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));


app.get('/', (req, res) => {
    res.send('Hello World!');
});

const port = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log(`Listening on port ${port}...`);
});