const { Sponsorship } = require('../models/sponsorship');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    await Sponsorship.find()
        .then((sponsors) => {
            if (!sponsors) {
                return res.status(404).send();
            }

            res.status(200).send({ sponsors });
        })
        .catch((e) => {
            res.status(400).send(e.message);
        });
});

router.post('/', async (req, res) => {
    const sponsor = new Sponsorship({
        sponsorId: req.body.sponsorId,
        podcastName: req.body.podcastName?.toLowerCase(),
        tags: req.body.tags,
        publishDate: req.body.publishDate
    });

    await sponsor.save()
        .then((sponsor) => {
            res.status(200).send(sponsor);
        })
        .catch((e) => {
            res.status(400).send(e.message);
        });
});


module.exports = router;