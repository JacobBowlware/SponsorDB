const { Sponsorship, validateSponsorship } = require('../models/sponsorship');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscribe = require('../middleware/subscribe');
const admin = require('../middleware/admin');

// Get all sponsorships (pairs of sponsors and podcasts)
router.get('/', auth, subscribe, admin, async (req, res) => {
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

// Create a new sponsorship
router.post('/', auth, async (req, res) => {
    const { error } = validateSponsorship(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

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