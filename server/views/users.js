const { User, validateUser } = require('../models/user');
const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
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
    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    let user = new User({
        email: req.body.email,
        password: req.body.password,
        isSubscribed: req.body.isSubscribed || false,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save()
        .then((user) => {
            res.send(_.pick(user, ['_id', 'name', 'email', 'isSubscribed']));
        })
        .catch((error) => {
            res.status(400).send(error);
        });
});

module.exports = router;