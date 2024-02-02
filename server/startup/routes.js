const express = require('express');
const users = require('../views/users');
const sponsors = require('../views/sponsors');

module.exports = (app) => {
    app.use(express.json());
    app.use('/api/users', users);
    app.use('/api/sponsors', sponsors)

    // Error handling middleware
    // app.use(error);
}