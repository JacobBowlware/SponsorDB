const express = require('express');
const router = express.Router();
const { PotentialSponsor, validatePotentialSponsor } = require('../models/potentialSponsor');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
require('../middleware/corHeaders')(router);


// Get all potential sponsors
router.get('/', [auth, admin], async (req, res) => {
    const potentialSponsors = await PotentialSponsor.find();
    res.status(200).send(potentialSponsors);
});

// Create a new potential sponsor
router.post('/', [auth, admin], async (req, res) => {
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
        res.status(400).send("Error saving to database...", e.message);
    });
});

router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const potentialSponsor = await PotentialSponsor.findByIdAndDelete(req.params.id);

        if (!potentialSponsor) {
            return res.status(400).send('The potential sponsor with the given ID was not found.');
        }

        res.send(potentialSponsor);
    }
    catch (ex) {
        console.log("Error deleting potential sponsor...", ex);
        return res.status(400).send(ex);
    }
});

module.exports = router;