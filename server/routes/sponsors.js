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
    // req.body could be a list of sponsors, or a single sponsor
    // If it's a list of sponsors, iterate through the list and validate each sponsor
    let error;
    if (Array.isArray(req.body)) {
        for (let sponsor of req.body) {
            const { sponsorError } = validateSponsor(sponsor);
            if (sponsorError) {
                error = sponsorError;
                break;
            }
        }
    }
    else {
        const { sponsorError } = validateSponsor(res.body);
        error = sponsorError;
    }


    if (error) {
        return res.status(400).send(error.details[0].message);
    }


    // If it's a list of sponsors, iterate through the list and save each sponsor
    if (Array.isArray(req.body)) {
        for (let sponsor of req.body) {
            const sponsorExists = await Sponsor.findOne({ sponsorName: sponsor.sponsorName.toLowerCase() });
            if (sponsorExists) {
                // Add the newsletter to the sponsor's newslettersSponsored array
                sponsorExists.newslettersSponsored.push(req.body.newsletterName);
            }
            else {
                const newSponsor = new Sponsor({
                    sponsorName: sponsor.sponsorName.toLowerCase(),
                    sponsorLink: sponsor.sponsorLink,
                    tags: sponsor.tags,
                    newslettersSponsored: [req.body.newsletterName]
                });
                await newSponsor.save().then((sponsor) => {
                    res.send(sponsor);
                }).catch((e) => {
                    res.status(400).send(e.message);
                });
            }
        }
    }
    else {
        // Sponsor does not exist, create a new sponsor
        const sponsor = new Sponsor({
            sponsorName: req.body.sponsorName.toLowerCase(),
            sponsorLink: req.body.sponsorLink,
            tags: req.body.tags
        });

        // Add the newsletter to the sponsor's newslettersSponsored array
        sponsor.newslettersSponsored.push(req.body.newsletterName);

        await sponsor.save().then((sponsor) => {
            res.send(sponsor);
        }).catch((e) => {
            res.status(400).send(e.message);
        });
    }
});

module.exports = router;