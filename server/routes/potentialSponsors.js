const express = require('express');
const router = express.Router();
const { PotentialSponsor, validatePotentialSponsor } = require('../models/potentialSponsor');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const emailMonitor = require('../scraper/emailMonitor');
require('../middleware/corHeaders')(router);


// Route to run emailMonitor.js 
router.get('/emailMonitor', [auth, admin], async (req, res) => {
    try {
        emailMonitor();
    }
    catch (e) {
        console.log("Error running email monitor...", e);
        return res.status(400).send(e);
    }
    res.status(200).send('Email Monitor is running...');
});

// Get all potential sponsors
router.get('/', [auth, admin], async (req, res) => {
    const potentialSponsors = await PotentialSponsor.find();
    res.status(200).send(potentialSponsors);
});

// Create a new potential sponsor
router.post('/', async (req, res) => {
    // Validate the request body (which could be either a potential sponsor, or an array of potential sponsors)
    const sponsors = req.body;
    if (!Array.isArray(sponsors)) {
        sponsors = [sponsors];
    }
    for (const sponsor of sponsors) {
        const { error } = validatePotentialSponsor(sponsor);
        if (error) {
            return res
                .status(400)
                .send(error.details[0].message);
        }
    }

    // Save the potential sponsors to the database
    await PotentialSponsor.insertMany(sponsors).then((sponsors) => {
        res.send(sponsors);
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