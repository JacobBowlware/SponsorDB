const express = require('express');
const router = express.Router();
const { Sponsor, validateSponsor } = require('../models/sponsor');
const auth = require('../middleware/auth');
require('../middleware/corHeaders')(router);


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
    // req.body could be a list of sponsors, or a single sponsor
    // If it's a list of sponsors, iterate through the list and validate each sponsor
    console.log("REQ BODY", req.body);
    let error;
    for (let sponsor of req.body) {
        const { sponsorError } = validateSponsor(sponsor);
        if (sponsorError) {
            error = sponsorError;
            res.status(400).send(error);
        }
    }

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    for (let sponsor of req.body) {
        console.log(sponsor);
        const sponsorExists = await Sponsor.findOne({ sponsorName: sponsor.sponsor });
        if (sponsorExists) {
            // Add the newsletter to the sponsor's newslettersSponsored array
            if (!sponsorExists.newslettersSponsored.includes(sponsor.newsletter)) {
                sponsorExists.newslettersSponsored.push(sponsor.newsletter);
                await sponsorExists.save().then((sponsor) => {
                    res.send(sponsor);
                }).catch((e) => {
                    res.status(400).send(e.message);
                });
            }
        }
        else {
            const newSponsor = new Sponsor({
                sponsorName: sponsor.sponsor,
                sponsorLink: sponsor.sponsorLink,
                tags: sponsor.tags,
                newslettersSponsored: [sponsor.newsletter]
            });
            await newSponsor.save().then((sponsor) => {
                res.send(sponsor);
            }).catch((e) => {
                res.status(400).send(e.message);
            });
        }
    }
});

module.exports = router;