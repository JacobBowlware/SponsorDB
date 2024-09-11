const express = require('express');
const router = express.Router();
const { PotentialSponsor, validatePotentialSponsor } = require('../models/potentialSponsor');
const auth = require('../middleware/auth');

// Get all potential sponsors
router.get('/', auth, async (req, res) => {
    const potentialSponsors = await PotentialSponsor.find();
    res.status(200).send(potentialSponsors);
});

// Create a new potential sponsor
router.post('/', auth, async (req, res) => {
    // Validate the request body
    const { error } = validatePotentialSponsor(req.body);

    // Return 400 if validation fails
    if (error) {
        return res
            .status(400)
            .send(error.details[0].message);
    }

    // Create a new potential sponsor
    const potentialSponsor = new PotentialSponsor({
        emailSender: req.body.emailSender,
        potentialSponsorLinks: req.body.potentialSponsorLinks
    });

    // Save the potential sponsor to the database
    await potentialSponsor.save().then((potentialSponsor) => {
        res.send(potentialSponsor);
    }).catch((e) => {
        res.status(400).send(e.message);
    });
});

module.exports = router;