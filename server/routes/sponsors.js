const express = require('express');
const router = express.Router();
const { Sponsor, validateSponsor } = require('../models/sponsor');
const auth = require('../middleware/auth');
require('../middleware/corHeaders')(router);

var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appn3l7KEp7wAQOZu');

const formatTags = (tags) => {
    // tags ==> ['tag1, tag2, tag3'], needs to be ['tag1', 'tag2', 'tag3']
    let newTags = [];
    try {
        if (tags.includes(',')) {
            newTags = tags.split(',');

            // Trim whitespace from each tag
            newTags = newTags.map(tag => tag.trim());
        } else {
            newTags = [tags]; // Wrap in an array if it's a single tag
        }
    } catch (e) {
        console.log("Error formatting tags", tags, e);
    }

    return newTags;
};

// Save new sponsor to Airtable
const saveToAirtable = async (sponsor) => {
    let updatedTags = formatTags(sponsor.tags);
    try {
        let fields = {
            "Tags": updatedTags, // Ensure tags are formatted correctly
            "Sponsor": sponsor.sponsor,
            "Sponsor Link": sponsor.sponsorLink,
            "Newsletter Sponsored": sponsor.newsletter,
        };

        // Conditionally add the "Subscriber Count" field if it exists
        if (sponsor.subscriberCount > 0) {
            fields["Audience Size"] = sponsor.subscriberCount;
        }

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

// Create a new sponsor
router.post('/', auth, async (req, res) => {
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
            let sponsorExists = await Sponsor.findOne({ sponsorName: sponsor.sponsor, newsletterSponsored: sponsor.newsletter });

            // If the sponsor does not already exist with the same newsletter sponsorship, create a new sponsor
            if (!sponsorExists) {
                const newSponsor = new Sponsor({
                    sponsorName: sponsor.sponsor,
                    sponsorLink: sponsor.sponsorLink,
                    tags: sponsor.tags,
                    newsletterSponsored: sponsor.newsletter,
                    subscriberCount: sponsor.subscriberCount
                });
                await newSponsor.save();

                // Save to Airtable
                await saveToAirtable(sponsor);
            }
        }
    } catch (e) {
        console.log("Error creating sponsor", e);
    }
});

module.exports = router;
