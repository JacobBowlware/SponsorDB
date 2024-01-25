const express = require('express');
const { User, validateUser } = require('../models/user');

const router = express.Router();

router.get('/:id', (req, res) => {
    User.findById(req.params.id)
        .then((user) => {
            if (!user) {
                return res.status(404).send();
            }

            res.send({ user });
        })
        .catch((error) => {
            res.status(400).send(error);
        });
})

router.post('/', async (req, res) => {
    // Validate User
    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Create User
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        isSubscribed: req.body.isSubscribed || false,
    });

    // Save User
    await user.save()
        .then((user) => {
            res.send(user);
        })
        .catch((error) => {
            res.status(400).send(error);
        });
});