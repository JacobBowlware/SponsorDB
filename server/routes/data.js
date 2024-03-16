const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscribe = require('../middleware/subscribe');
const admin = require('../middleware/admin');
const { Sponsor } = require('../models/sponsor');
const { Sponsorship } = require('../models/sponsorship');

router.get('/', async (req, res) => {
    const sponsors = await Sponsor.find();
    const sponsorships = await Sponsorship.find();

    const sponsorLength = sponsors.length;
    const sponsorshipLength = sponsorships.length;
    res.status(200).send({ "sponsorshipLength": sponsorshipLength, "sponsorLength": sponsorLength });
});

module.exports = router;