const express = require('express');
const users = require('../routes/users');
const sponsors = require('../routes/sponsors');
const sponsorships = require('../routes/sponsorships');
const auth = require('../routes/auth');
const error = require('../middleware/error');

module.exports = (app) => {
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/sponsors', sponsors);
    app.use('/api/sponsorships', sponsorships);
    app.use('/api/auth', auth);
    app.use((err, req, res, next) => {
        error(err, req, res, next);
    });
}