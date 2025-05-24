const express = require('express');
const users = require('../routes/users');
const sponsors = require('../routes/sponsors');
const potentialSponsors = require('../routes/potentialSponsors');
const stripeWebhook = require('../routes/stripeWebhook');
const auth = require('../routes/auth');
const error = require('../middleware/error');
const blog = require('../routes/blog');
module.exports = (app) => {
    app.use('/api/stripeWebhook', express.raw({ type: 'application/json' }), stripeWebhook);

    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/blog', blog);
    app.use('/api/sponsors', sponsors);
    app.use('/api/potentialSponsors', potentialSponsors);
    app.use('/api/auth', auth);
    app.use((err, req, res, next) => {
        error(err, req, res, next);
    });
}