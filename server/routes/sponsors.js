const express = require('express');
const router = express.Router();
const { Sponsor, validateSponsor } = require('../models/sponsor');
const auth = require('../middleware/auth');

// Get all sponsors
router.get('/', auth, async (req, res) => {
    const sponsors = await Sponsor.find();
    res.status(200).send(sponsors);
});

// Get the number of sponsors
router.get('/count', async (req, res) => {
    const sponsors = await Sponsor.find();

    const sponsorCount = sponsors.length;
    res.status(200).send({ "count": sponsorCount });
});

// Create a new sponsor
router.post('/', auth, async (req, res) => {
    const { error } = validateSponsor(res.body);
    if (error) {
        if (error.details[0].message.includes('sponsorName')) {
            return res.status(400).send('Invalid sponsor name');
        }
        return res.status(400).send(error.details[0].message);
    }

    const sponsor = new Sponsor({
        sponsorName: req.body.sponsorName.toLowerCase(),
        sponsorLink: req.body.sponsorLink,
        tags: req.body.tags
    });

    // Check if sponsor already exists
    const sponsorExists = await Sponsor.findOne({ sponsorName: req.body.sponsorName.toLowerCase() });
    if (sponsorExists) {
        return res.status(400).send('Sponsor already exists');
    }

    await sponsor.save().then((sponsor) => {
        res.send(sponsor);
    }).catch((e) => {
        res.status(400).send(e.message);
    })
});

module.exports = router;