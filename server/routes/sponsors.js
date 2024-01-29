const express = require('express');
const router = express.Router();

const { Sponsor, validateSponsor } = require('../models/sponsor');

/* TODO:
- Hash passwords before saving.
*/
router.post('/', async (req, res) => {
    const { error } = validateSponsor(res.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const sponsor = new Sponsor({
        sponsorName: req.body.sponsorName,
        sponsorLink: req.body.sponsorLink,
        tags: req.body.tags
    });

    await sponsor.save().then((sponsor) => {
        res.send(sponsor);
    }).catch((e) => {
        console.log(e);
    })
})

