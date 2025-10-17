const express = require('express');
const router = express.Router();
const { Sponsor, validateSponsor } = require('../models/sponsor');
const { PotentialSponsor } = require('../models/potentialSponsor');
const csv = require('csv-parser');
const fs = require('fs');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Import sponsors csv
var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base('appn3l7KEp7wAQOZu');

// Save new sponsor to Airtable
const saveToAirtable = async (sponsor) => {
    try {
        let fields = {
            "Market": sponsor.tags,
            "Sponsor": sponsor.sponsorName,
            "Sponsor Link": sponsor.sponsorLink,
            "Newsletter Sponsored": sponsor.newsletterSponsored,
            "Audience Size": sponsor.subscriberCount,
            "Apply for Sponsorship": sponsor.businessContact
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
    try {
        // Build query based on affiliate filter
        let query = {
            $or: [
                { sponsorEmail: { $exists: true, $ne: '' } },
                { sponsorApplication: { $exists: true, $ne: '' } },
                { businessContact: { $exists: true, $ne: '' } }
            ]
        };
        
        // Add affiliate filter if requested
        if (req.query.affiliateOnly === 'true') {
            console.log('🔍 Backend: Filtering for affiliate sponsors only');
            const affiliateQuery = {
                $and: [
                    {
                        $or: [
                            { sponsorEmail: { $exists: true, $ne: '' } },
                            { sponsorApplication: { $exists: true, $ne: '' } },
                            { businessContact: { $exists: true, $ne: '' } }
                        ]
                    },
                    {
                        $or: [
                            { isAffiliateProgram: true },
                            { tags: { $in: ['Affiliate'] } }
                        ]
                    }
                ]
            };
            query = affiliateQuery;
            console.log('🔍 Backend: Affiliate query created');
        }
        
        // Fetch all sponsors with contact info and include whether the current user has viewed/applied to them
        const sponsors = await Sponsor.find(query);
        console.log(`🔍 Backend: Found ${sponsors.length} sponsors`);
        
        if (req.query.affiliateOnly === 'true') {
            console.log('🔍 Backend: Affiliate sponsors found:');
            sponsors.forEach(sponsor => {
                console.log(`  - ${sponsor.sponsorName}: isAffiliateProgram=${sponsor.isAffiliateProgram}, tags=${JSON.stringify(sponsor.tags)}`);
            });
        }
        
        const sponsorsWithStatus = sponsors.map(sponsor => {
            const sponsorObj = sponsor.toObject();
            const isViewed = sponsor.viewedBy.includes(req.user._id);
            const isApplied = sponsor.appliedBy.includes(req.user._id);
            
            // Get user's view and apply dates
            const userViewData = sponsor.userViewDates.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = sponsor.userApplyDates.find(d => d.user.toString() === req.user._id.toString());
            
            return {
                ...sponsorObj,
                isViewed,
                isApplied,
                dateViewed: userViewData ? userViewData.dateViewed : null,
                dateApplied: userApplyData ? userApplyData.dateApplied : null
            };
        });
        res.status(200).send(sponsorsWithStatus);
    } catch (e) {
        console.log("Error getting sponsors", e);
        res.status(500).send("Error getting sponsors");
    }
});

// Get DB info {sponsor count, newsletter count, last updated date}
router.get('/db-info', async (req, res) => {
    try {
        // Get sponsor count - only sponsors with contact info (simplified check)
        const sponsors = await Sponsor.find({
            $or: [
                { sponsorEmail: { $exists: true, $ne: '' } },
                { sponsorApplication: { $exists: true, $ne: '' } },
                { businessContact: { $exists: true, $ne: '' } }
            ]
        });
        const sponsorCount = sponsors.length;

        // Get newsletter count - only from sponsors with contact info
        const newsletters = await Sponsor.distinct("newsletterSponsored", {
            $or: [
                { sponsorEmail: { $exists: true, $ne: '' } },
                { sponsorApplication: { $exists: true, $ne: '' } },
                { businessContact: { $exists: true, $ne: '' } }
            ]
        });
        const newsletterCount = newsletters.length;

        // Get last updated date (from most recently added sponsor with contact info)
        const lastSponsor = await Sponsor.find({
            $or: [
                { sponsorEmail: { $exists: true, $ne: '' } },
                { sponsorApplication: { $exists: true, $ne: '' } },
                { businessContact: { $exists: true, $ne: '' } }
            ]
        }).sort({ _id: -1 }).limit(1);
        
        // Use _id timestamp if dateAdded is not available or is old
        let lastUpdated = null;
        if (lastSponsor[0]) {
            const sponsor = lastSponsor[0];
            const idTimestamp = new Date(parseInt(sponsor._id.toString().substring(0, 8), 16) * 1000);
            const dateAdded = sponsor.dateAdded ? new Date(sponsor.dateAdded) : null;
            
            // Use the more recent date between _id timestamp and dateAdded
            if (dateAdded && dateAdded > idTimestamp) {
                lastUpdated = dateAdded;
            } else {
                lastUpdated = idTimestamp;
            }
        }

        res.status(200).send({ "sponsors": sponsorCount, "newsletters": newsletterCount, "lastUpdated": lastUpdated });
    }
    catch (e) {
        console.log("Error getting DB info", e);
        res.status(500).send("Error getting DB info");
    }
});

// Get analytics data for admin dashboard
router.get('/analytics', async (req, res) => {
    try {
        const { PotentialSponsor } = require('../models/potentialSponsor');
        
        // Get current date and calculate date ranges
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get potential sponsors
        const potentialSponsors = await PotentialSponsor.find();
        const totalPotentialSponsors = potentialSponsors.length;
        
        // Get approved sponsors (from main sponsors collection)
        const approvedSponsors = await Sponsor.find({
            dateAdded: { $gte: startOfMonth }
        });
        const totalApprovedSponsors = approvedSponsors.length;
        
        // Get denied sponsors (from denied domains)
        const { DeniedSponsorLink } = require('../models/deniedSponsorLink');
        const deniedDomains = await DeniedSponsorLink.find({
            dateDenied: { $gte: startOfMonth }
        });
        const totalDeniedSponsors = deniedDomains.length;
        
        // Calculate average confidence
        const averageConfidence = totalPotentialSponsors > 0 ? 
            potentialSponsors.reduce((sum, sponsor) => sum + (sponsor.confidence || 0), 0) / totalPotentialSponsors : 0;
        
        // Get sponsors added this week
        const sponsorsThisWeek = await PotentialSponsor.countDocuments({
            dateAdded: { $gte: oneWeekAgo }
        });
        
        // Get sponsors added this month
        const sponsorsThisMonth = await PotentialSponsor.countDocuments({
            dateAdded: { $gte: startOfMonth }
        });
        
        // Get top newsletters by sponsor count
        const newsletterCounts = await PotentialSponsor.aggregate([
            {
                $group: {
                    _id: "$newsletterSponsored",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);
        
        const topNewsletters = newsletterCounts.map(item => ({
            name: item._id || 'Unknown',
            count: item.count
        }));
        
        // Get contact method breakdown
        const contactMethodCounts = await PotentialSponsor.aggregate([
            {
                $group: {
                    _id: "$contactMethod",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const contactMethodBreakdown = contactMethodCounts.map(item => ({
            method: item._id || 'none',
            count: item.count
        }));
        
        // Get weekly growth data (last 4 weeks)
        const weeklyGrowth = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const count = await PotentialSponsor.countDocuments({
                dateAdded: { $gte: weekStart, $lt: weekEnd }
            });
            
            weeklyGrowth.push({
                date: weekStart.toISOString().split('T')[0],
                count: count
            });
        }
        
        const analytics = {
            totalPotentialSponsors,
            totalApprovedSponsors,
            totalDeniedSponsors,
            averageConfidence: Math.round(averageConfidence),
            sponsorsThisWeek,
            sponsorsThisMonth,
            topNewsletters,
            contactMethodBreakdown,
            weeklyGrowth
        };
        
        res.status(200).send(analytics);
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).send('Error getting analytics');
    }
});

// Create a new sponsor
router.post('/', auth, async (req, res) => {
    const sponsor = req.body;

    // Validate the request body
    const { sponsorError } = validateSponsor(sponsor);
    if (sponsorError) {
        return res.status(400).send(sponsorError);
    }


    try {
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
            subscriberCount: sponsor.subscriberCount,
            businessContact: sponsor.businessContact,
            rootDomain: sponsor.rootDomain
        });
        await newSponsor.save().then(() => {
            console.log("Sponsor created successfully.");
        })

        // Save to Airtable [DEPRECATED]
        // await saveToAirtable(sponsor).then(() => {
        //     console.log("Saved to Airtable");
        // }).catch((e) => {
        //     console.log("Error saving to Airtable", e);
        // });

        // Delete potential sponsor from potentialSponsors collection
        await PotentialSponsor.findByIdAndDelete(sponsor._id).then(() => {
            console.log("Deleted potential sponsor");
        }
        ).catch((e) => {
            console.log("Error deleting potential sponsor", e);
        });

        res.status(201).send(req.body);
    } catch (e) {
        console.log("Error creating sponsor", e);
        res.status(500).send("Error creating sponsor");
    }
});


// Get sample sponsors (8 random sponsors)
router.get('/sample', async (req, res) => {
    try {
        const sampleSponsors = await Sponsor.aggregate([
            { $sample: { size: 8 } },
            { $project: {
                sponsorName: 1,
                sponsorLink: 1,
                tags: 1,
                newsletterSponsored: 1,
                subscriberCount: 1
            }}
        ]);
        res.status(200).send(sampleSponsors);
    } catch (e) {
        console.log("Error getting sample sponsors", e);
        res.status(500).send("Error getting sample sponsors");
    }
});

// Update a sponsor
router.put('/:id', [auth, admin], async (req, res) => {
    try {
        const { error } = validateSponsor(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const sponsor = await Sponsor.findByIdAndUpdate(
            req.params.id,
            {
                sponsorName: req.body.sponsorName,
                sponsorLink: req.body.sponsorLink,
                rootDomain: req.body.rootDomain,
                tags: req.body.tags,
                newsletterSponsored: req.body.newsletterSponsored,
                subscriberCount: req.body.subscriberCount,
                sponsorEmail: req.body.sponsorEmail,
                sponsorApplication: req.body.sponsorApplication,
                contactMethod: req.body.contactMethod
            },
            { new: true }
        );

        if (!sponsor) {
            return res.status(404).send('The sponsor with the given ID was not found.');
        }

        res.send(sponsor);
    } catch (e) {
        console.log("Error updating sponsor", e);
        res.status(500).send("Error updating sponsor");
    }
});

// Mark a sponsor as viewed by a user
router.post('/:id/view', auth, async (req, res) => {
    try {
        console.log('View request for sponsor ID:', req.params.id);
        console.log('User ID:', req.user._id);
        
        // Check if user has already viewed
        const existingSponsor = await Sponsor.findById(req.params.id);
        if (!existingSponsor) {
            console.log('Sponsor not found with ID:', req.params.id);
            return res.status(404).send('The sponsor with the given ID was not found.');
        }
        
        const hasViewed = existingSponsor.viewedBy.includes(req.user._id);
        
        console.log('Found sponsor:', existingSponsor.sponsorName);
        console.log('User has viewed:', hasViewed);
        
        if (!hasViewed) {
            // Use atomic update to avoid version conflicts
            const currentDate = new Date();
            const updatedSponsor = await Sponsor.findByIdAndUpdate(
                req.params.id,
                {
                    $addToSet: {
                        viewedBy: req.user._id,
                        userViewDates: {
                            user: req.user._id,
                            dateViewed: currentDate
                        }
                    }
                },
                { new: true, runValidators: true }
            );
            
            if (!updatedSponsor) {
                console.log('Failed to update sponsor');
                return res.status(500).send('Failed to update sponsor');
            }
            
            console.log('Successfully updated sponsor with view');
            
            // Return processed sponsor data with user status
            const sponsorObj = updatedSponsor.toObject();
            const isViewed = updatedSponsor.viewedBy.includes(req.user._id);
            const isApplied = updatedSponsor.appliedBy.includes(req.user._id);
            
            // Get user's view and apply dates
            const userViewData = updatedSponsor.userViewDates.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = updatedSponsor.userApplyDates.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed,
                isApplied,
                dateViewed: userViewData ? userViewData.dateViewed : null,
                dateApplied: userApplyData ? userApplyData.dateApplied : null
            };

            console.log('Returning processed sponsor with isViewed:', isViewed, 'isApplied:', isApplied);
            res.send(processedSponsor);
        } else {
            console.log('User already viewed this sponsor');
            // Return the existing sponsor data
            const sponsorObj = existingSponsor.toObject();
            const isViewed = existingSponsor.viewedBy.includes(req.user._id);
            const isApplied = existingSponsor.appliedBy.includes(req.user._id);
            
            // Get user's view and apply dates
            const userViewData = existingSponsor.userViewDates.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = existingSponsor.userApplyDates.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed,
                isApplied,
                dateViewed: userViewData ? userViewData.dateViewed : null,
                dateApplied: userApplyData ? userApplyData.dateApplied : null
            };

            res.send(processedSponsor);
        }
    } catch (e) {
        console.log("Error marking sponsor as viewed", e);
        console.log("Error details:", e.message);
        console.log("Error stack:", e.stack);
        res.status(500).send("Error marking sponsor as viewed");
    }
});

// Mark a sponsor as applied by a user
router.post('/:id/apply', auth, async (req, res) => {
    try {
        console.log('Apply request for sponsor ID:', req.params.id);
        console.log('User ID:', req.user._id);
        
        // Use findByIdAndUpdate with atomic operations to avoid version conflicts
        const updateData = {};
        const currentDate = new Date();
        
        // Check if user has already applied
        const existingSponsor = await Sponsor.findById(req.params.id);
        if (!existingSponsor) {
            console.log('Sponsor not found with ID:', req.params.id);
            return res.status(404).send('The sponsor with the given ID was not found.');
        }
        
        const hasApplied = existingSponsor.appliedBy.includes(req.user._id);
        const hasViewed = existingSponsor.viewedBy.includes(req.user._id);
        
        console.log('Found sponsor:', existingSponsor.sponsorName);
        console.log('User has applied:', hasApplied);
        console.log('User has viewed:', hasViewed);
        
        // Prepare update operations
        if (!hasApplied) {
            updateData.$addToSet = {
                appliedBy: req.user._id,
                userApplyDates: {
                    user: req.user._id,
                    dateApplied: currentDate
                }
            };
        }
        
        if (!hasViewed) {
            if (!updateData.$addToSet) {
                updateData.$addToSet = {};
            }
            updateData.$addToSet.viewedBy = req.user._id;
            updateData.$addToSet.userViewDates = {
                user: req.user._id,
                dateViewed: currentDate
            };
        }
        
        // Only update if there are changes to make
        if (Object.keys(updateData).length > 0) {
            console.log('Updating sponsor with:', updateData);
            const updatedSponsor = await Sponsor.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            );
            
            if (!updatedSponsor) {
                console.log('Failed to update sponsor');
                return res.status(500).send('Failed to update sponsor');
            }
            
            console.log('Successfully updated sponsor');
            
            // Create user application record if this is a new application
            if (!hasApplied) {
                try {
                    const { UserApplication } = require('../models/userApplication');
                    const applicationData = {
                        userId: req.user._id,
                        sponsorId: req.params.id,
                        sponsorName: updatedSponsor.sponsorName,
                        contactEmail: updatedSponsor.businessContact || updatedSponsor.sponsorEmail || '',
                        dateApplied: currentDate,
                        status: 'pending',
                        lastContactDate: currentDate
                    };
                    
                    const application = new UserApplication(applicationData);
                    await application.save();
                    console.log('Created user application record:', application._id);
                } catch (appError) {
                    console.error('Error creating user application:', appError);
                    // Don't fail the request if application record creation fails
                }
            }
            
            // Return processed sponsor data with user status
            const sponsorObj = updatedSponsor.toObject();
            const isViewed = updatedSponsor.viewedBy.includes(req.user._id);
            const isApplied = updatedSponsor.appliedBy.includes(req.user._id);
            
            // Get user's view and apply dates
            const userViewData = updatedSponsor.userViewDates.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = updatedSponsor.userApplyDates.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed,
                isApplied,
                dateViewed: userViewData ? userViewData.dateViewed : null,
                dateApplied: userApplyData ? userApplyData.dateApplied : null
            };

            console.log('Returning processed sponsor with isViewed:', isViewed, 'isApplied:', isApplied);
            res.send(processedSponsor);
        } else {
            console.log('No updates needed, user already applied and viewed');
            // Return the existing sponsor data
            const sponsorObj = existingSponsor.toObject();
            const isViewed = existingSponsor.viewedBy.includes(req.user._id);
            const isApplied = existingSponsor.appliedBy.includes(req.user._id);
            
            // Get user's view and apply dates
            const userViewData = existingSponsor.userViewDates.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = existingSponsor.userApplyDates.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed,
                isApplied,
                dateViewed: userViewData ? userViewData.dateViewed : null,
                dateApplied: userApplyData ? userApplyData.dateApplied : null
            };

            res.send(processedSponsor);
        }
    } catch (e) {
        console.log("Error marking sponsor as applied", e);
        console.log("Error details:", e.message);
        console.log("Error stack:", e.stack);
        res.status(500).send("Error marking sponsor as applied");
    }
});

module.exports = router;