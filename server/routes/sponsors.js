const express = require('express');
const router = express.Router();
const { Sponsor, validateSponsor } = require('../models/sponsor');

router.post('/', async (req, res) => {
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

// TODO: Put auth middleware here
router.get('/', async (req, res) => {
    await Sponsor.find().sort('sponsorName').then((sponsors) => {
        res.status(200).send(sponsors);
    }).catch((e) => {
        console.log(e);
    });
});

module.exports = router;