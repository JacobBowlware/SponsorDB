const express = require('express');
const router = express.Router();
const { Sponsor, validateSponsor } = require('../models/sponsor');
const { Sponsorship } = require('../models/sponsorship');
const auth = require('../middleware/auth');
const subscribe = require('../middleware/subscribe');
const admin = require('../middleware/admin');

// Get basic sponsor info from db (# of sponsorships, # of companies)
router.get('/count', async (req, res) => {
    const sponsors = await Sponsor.find();
    const sponsorships = await Sponsorship.find();

    const sponsorLength = sponsors.length;
    const sponsorshipLength = sponsorships.length;
    res.status(200).send({ sponsorLength, sponsorshipLength });
});

// Get all sponsors
router.get('/', auth, subscribe, admin, async (req, res) => {
    await Sponsor.find().sort('sponsorName').then((sponsors) => {
        res.status(200).send(sponsors);
    }).catch((e) => {
        console.log(e);
    });
});

// Create a new sponsor
router.post('/', auth, async (req, res) => {
    const { error } = validateSponsor(res.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const sponsor = new Sponsor({
        sponsorName: req.body.sponsorName?.toLowerCase(),
        sponsorLink: req.body.sponsorLink,
    });

    // Check if sponsor already exists
    const sponsorExists = await Sponsor.findOne({ sponsorName: req.body.sponsorName?.toLowerCase() });
    if (sponsorExists) {
        return res.status(400).send('Sponsor already exists');
    }

    await sponsor.save().then((sponsor) => {
        res.send(sponsor);
    }).catch((e) => {
        console.log(e);
        res.status(400).send(e.message);
    })
})

module.exports = router;