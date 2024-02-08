const express = require('express');
const users = require('../routes/users');
const sponsors = require('../routes/sponsors');
const sponsorships = require('../routes/sponsorships');
const auth = require('../routes/auth');

module.exports = (app) => {
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/sponsors', sponsors);
    app.use('/api/sponsorships', sponsorships);
    app.use('/api/auth', auth);

    // Error handling middleware
    // app.use(error);
}