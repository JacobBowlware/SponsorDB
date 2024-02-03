const express = require('express');
const users = require('../views/users');
const sponsors = require('../views/sponsors');
const sponsorships = require('../views/sponsorships');

module.exports = (app) => {
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/sponsors', sponsors);
    app.use('/api/sponsorships', sponsorships);

    // Error handling middleware
    // app.use(error);
}