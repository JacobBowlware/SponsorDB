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
        if (tags[0].includes(',')) {
            newTags = tags[0].split(',');

            // Trim whitespace from each tag
            newTags = newTags.map(tag => tag.trim());
        } else {
            newTags = tags; // Wrap in an array if it's a single tag
        }
    } catch (e) {
        console.log("Error formatting tags", tags, e);
    }

    return newTags;
};

// Update sponsor in Airtable with new newsletter using Sponsor Name or Link
const updateAirtable = async (sponsor) => {
    try {
        base('Sponsors').select({
            filterByFormula: `{Sponsor} = "${sponsor.sponsorName}"`,
            maxRecords: 1
        }).firstPage(async function (err, records) {
            if (err) {
                console.error(err);
                return;
            }

            if (records.length === 0) {
                console.log('No sponsor found with the given name/link.');
                return;
            }

            const record = records[0]; // Get the first (and should be only) matching record
            const airtableId = record.id; // Get the Airtable ID for the sponsor

            // Update the Airtable record with the new values
            base('Sponsors').update([
                {
                    "id": airtableId,
                    "fields": {
                        "Newsletters Sponsored": sponsor.newslettersSponsored, // Append newsletter to newslettersSponsored
                    }
                }
            ], function (err, records) {
                if (err) {
                    console.error(err);
                    return;
                }
                records.forEach(function (record) {
                    console.log('Updated record ID:', record.getId());
                });
            });
        });
    } catch (e) {
        console.log("Error updating AirTable", e);
    }
};

// Save new sponsor to Airtable
const saveToAirtable = async (sponsor) => {
    try {
        base('Sponsors').create([
            {
                "fields": {
                    "Tags": formatTags(sponsor.tags), // Ensure tags are formatted correctly
                    "Sponsor": sponsor.sponsorName,
                    "Sponsor Link": sponsor.sponsorLink,
                    "Newsletters Sponsored": sponsor.newslettersSponsored
                }
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

    // For every sponsor found in the request body, store if it doesn't already exist, or update it if it does
    for (let sponsor of req.body) {
        let sponsorExists = await Sponsor.findOne({ sponsorName: sponsor.sponsor });

        // If the sponsor exists, update the newslettersSponsored string with the new newsletter
        if (sponsorExists) {
            // Add the newsletter to the sponsor's newslettersSponsored string
            if (!sponsorExists.newslettersSponsored.includes(sponsor.newsletter)) {
                // Append newsletter, add ", " only if necessary
                sponsorExists.newslettersSponsored += sponsorExists.newslettersSponsored ? `, ${sponsor.newsletter}` : sponsor.newsletter;
                await sponsorExists.save();

                // Update Airtable
                await updateAirtable(sponsorExists);
            }
        }
        // If the sponsor doesn't exist, create a new sponsor
        else {
            const newSponsor = new Sponsor({
                sponsorName: sponsor.sponsor,
                sponsorLink: sponsor.sponsorLink,
                tags: sponsor.tags,
                newslettersSponsored: sponsor.newsletter
            });
            await newSponsor.save().then(async (sponsor) => {
                // Format tags
                let tags = sponsor.tags;
                tags = formatTags(tags);
                sponsor.tags = tags;

                // Save to Airtable
                await saveToAirtable(sponsor);
            }).catch((e) => {
                // If there is an error, send the error message back to the client
                return res.status(400).send(e.message);
            });
        }
    }
});

module.exports = router;
