const express = require('express');
const router = express.Router();
const { Sponsor, validateSponsor } = require('../models/sponsor');
const { PotentialSponsor } = require('../models/potentialSponsor');
const auth = require('../middleware/auth');
require('../middleware/corHeaders')(router);

var Airtable = require('airtable');
const { isArray } = require('lodash');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appn3l7KEp7wAQOZu');

// Save new sponsor to Airtable
const saveToAirtable = async (sponsor) => {
    try {
        let fields = {
            "Tags": sponsor.tags,
            "Sponsor": sponsor.sponsorName,
            "Sponsor Link": sponsor.sponsorLink,
            "Newsletter Sponsored": sponsor.newsletterSponsored,
            "Audience Size": sponsor.subscriberCount
        };

        base('Sponsors').create([
            {
                "fields": fields
            }
        ], function (err, records) {
            if (err) {
                console.error(err);
                return;
            }
            records.forEach(function (record) {
                console.log('Created record ID:', record.getId());
            });
        });
    } catch (e) {
        console.log("Error saving to AirTable", e);
    }
};

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

// Create a new sponsor (or multiple sponsors)
router.post('/', auth, async (req, res) => {
    if (!isArray(req.body)) {
        // If req was not array, we need to wrap it in an array
        req.body = [req.body];
    }

    // Validate the request body
    let error;
    for (let sponsor of req.body) {
        const { sponsorError } = validateSponsor(sponsor);
        if (sponsorError) {
            error = sponsorError;
            return res.status(400).send(error);
        }
    }

    try {
        for (let sponsor of req.body) {
            let sponsorExists = await Sponsor.findOne({ sponsorName: sponsor.sponsorName, newsletterSponsored: sponsor.newsletterSponsored });
            if (sponsorExists) {
                console.log("Sponsor already exists");
                return res.status(400).send("Sponsor already exists");
            }

            // If the sponsor does not already exist with the same newsletter sponsorship, create a new sponsor
            const newSponsor = new Sponsor({
                sponsorName: sponsor.sponsorName,
                sponsorLink: sponsor.sponsorLink,
                tags: sponsor.tags,
                newsletterSponsored: sponsor.newsletterSponsored,
                subscriberCount: sponsor.subscriberCount
            });
            await newSponsor.save().then(() => {
                console.log("Sponsor created successfully.");
            })

            // Save to Airtable
            await saveToAirtable(sponsor).then(() => {
                console.log("Saved to Airtable");
            }).catch((e) => {
                console.log("Error saving to Airtable", e);
            });

            // Delete potential sponsor from potentialSponsors collection
            await PotentialSponsor.findByIdAndDelete(sponsor._id).then(() => {
                console.log("Deleted potential sponsor");
            }
            ).catch((e) => {
                console.log("Error deleting potential sponsor", e);
            });
        }

        res.status(201).send(req.body);
    } catch (e) {
        console.log("Error creating sponsor", e);
        res.status(500).send("Error creating sponsor");
    }
});

module.exports = router;
