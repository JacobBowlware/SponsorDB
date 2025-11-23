const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Sponsor, validateSponsor } = require('../models/sponsor');
const { SponsorNew, validateSponsorNew } = require('../models/sponsorNew');
const { Affiliate } = require('../models/affiliate');
const { PotentialSponsor } = require('../models/potentialSponsor');
const csv = require('csv-parser');
const fs = require('fs');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { getMatchedSponsors } = require('../utils/sponsorMatching');
const { User } = require('../models/user');

// Helper function to get collapsed sponsors (one per company) with most recent newsletter date
const getCollapsedSponsorsForFrontend = (sponsors, userId = null) => {
    const collapsed = [];
    
    sponsors.forEach(sponsor => {
        const sponsorObj = sponsor.toObject ? sponsor.toObject() : sponsor;
        const newsletters = sponsorObj.newslettersSponsored || [];
        
        // Find most recent newsletter date
        let mostRecentDate = sponsorObj.dateAdded;
        let mostRecentNewsletter = null;
        
        if (newsletters.length > 0) {
            newsletters.forEach(newsletter => {
                const date = newsletter.dateSponsored ? new Date(newsletter.dateSponsored) : null;
                if (date && (!mostRecentDate || date > new Date(mostRecentDate))) {
                    mostRecentDate = date;
                    mostRecentNewsletter = newsletter;
                }
            });
        }
        
        // Create collapsed sponsor record
        const collapsedSponsor = {
            ...sponsorObj,
            // Show most recent newsletter info
            newsletterSponsored: mostRecentNewsletter ? mostRecentNewsletter.newsletterName : (sponsorObj.newsletterSponsored || ''),
            subscriberCount: mostRecentNewsletter ? mostRecentNewsletter.estimatedAudience : (sponsorObj.subscriberCount || 0),
            dateSponsored: mostRecentDate, // Most recent newsletter date
            mostRecentNewsletterDate: mostRecentDate,
            // Keep full newslettersSponsored array for reference
            newslettersSponsored: newsletters,
            // Count of total placements
            totalPlacements: newsletters.length || (sponsorObj.newsletterSponsored ? 1 : 0),
            // User tracking
            isViewed: userId && sponsorObj.viewedBy ? sponsorObj.viewedBy.some(id => id.toString() === userId.toString()) : false,
            isApplied: userId && sponsorObj.appliedBy ? sponsorObj.appliedBy.some(id => id.toString() === userId.toString()) : false
        };
        
        collapsed.push(collapsedSponsor);
    });
    
    // Sort by most recent newsletter date (most recent first)
    collapsed.sort((a, b) => {
        const dateA = new Date(a.mostRecentNewsletterDate || a.dateAdded || 0).getTime();
        const dateB = new Date(b.mostRecentNewsletterDate || b.dateAdded || 0).getTime();
        return dateB - dateA; // Descending order
    });
    
    return collapsed;
};

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

// Get all sponsors - uses new structure, falls back to old if needed
router.get('/', auth, async (req, res) => {
    try {
        // Try to use new structure first
        let sponsors = [];
        let useNewStructure = true;
        
        try {
            // Build query based on affiliate filter
            // Default: Only show sponsors with email or businessContact (NOT affiliate-only)
            // For regular users, only show approved sponsors
            let query = {
                status: 'approved', // Only show approved sponsors to regular users
                $or: [
                    { sponsorEmail: { $exists: true, $ne: '' } },
                    { businessContact: { $exists: true, $ne: '' } }
                ]
            };
            
            // Add affiliate filter if requested
            if (req.query.affiliateOnly === 'true') {
                // For affiliates, query the Affiliate collection instead
                const affiliates = await Affiliate.find({
                    status: 'approved'
                });
                
                const affiliatesWithStatus = affiliates.map(affiliate => {
                    const affiliateObj = affiliate.toObject();
                    return {
                        ...affiliateObj,
                        sponsorName: affiliateObj.affiliateName,
                        sponsorLink: affiliateObj.affiliateLink,
                        affiliateSignupLink: affiliateObj.affiliateLink,
                        isAffiliateProgram: true,
                        newslettersSponsored: affiliateObj.affiliatedNewsletters || [],
                        newsletterSponsored: affiliateObj.affiliatedNewsletters?.[0]?.newsletterName || '',
                        subscriberCount: affiliateObj.affiliatedNewsletters?.[0]?.estimatedAudience || 0,
                        isViewed: false,
                        isApplied: false
                    };
                });
                
                return res.status(200).send(affiliatesWithStatus);
            }
            
            // Fetch from new collection
            sponsors = await SponsorNew.find(query);
            console.log(`🔍 Backend: Found ${sponsors.length} sponsors from new collection`);
        } catch (error) {
            console.log('New collection not available, falling back to old structure:', error);
            useNewStructure = false;
            
            // Fallback to old structure
            let query = {
                status: 'approved',
                $or: [
                    { sponsorEmail: { $exists: true, $ne: '' } },
                    { businessContact: { $exists: true, $ne: '', $regex: '@' } }
                ]
            };
            
            sponsors = await Sponsor.find(query);
            console.log(`🔍 Backend: Found ${sponsors.length} sponsors from old collection`);
        }
        
        // Return collapsed view (one per company) sorted by most recent newsletter date
        const collapsedSponsors = getCollapsedSponsorsForFrontend(sponsors, req.user._id);
        
        // Add user view/apply dates
        collapsedSponsors.forEach(sponsor => {
            const originalSponsor = sponsors.find(s => s._id.toString() === sponsor._id.toString());
            if (originalSponsor) {
                const userViewData = originalSponsor.userViewDates?.find(d => d.user.toString() === req.user._id.toString());
                const userApplyData = originalSponsor.userApplyDates?.find(d => d.user.toString() === req.user._id.toString());
                sponsor.dateViewed = userViewData ? userViewData.dateViewed : null;
                sponsor.dateApplied = userApplyData ? userApplyData.dateApplied : null;
            }
        });
        
        res.status(200).send(collapsedSponsors);
    } catch (e) {
        console.log("Error getting sponsors", e);
        res.status(500).send("Error getting sponsors");
    }
});

// Get DB info {sponsor company count, unique newsletter count, last updated date}
router.get('/db-info', async (req, res) => {
    try {
        let sponsorCompaniesCount = 0; // Total number of unique sponsor companies
        let newsletterCount = 0;
        let lastUpdated = null;
        
        // Try new structure first
        try {
            const newSponsorCount = await SponsorNew.countDocuments({ status: 'approved' });
            
            // Only use new structure if it has data, otherwise fall back
            if (newSponsorCount > 0) {
                sponsorCompaniesCount = newSponsorCount;
                
                // Get unique newsletters from newslettersSponsored arrays
                const sponsors = await SponsorNew.find({ status: 'approved' });
                const newsletterSet = new Set();
                
                sponsors.forEach(sponsor => {
                    if (sponsor.newslettersSponsored && sponsor.newslettersSponsored.length > 0) {
                        sponsor.newslettersSponsored.forEach(n => {
                            if (n.newsletterName && n.newsletterName.trim()) {
                                newsletterSet.add(n.newsletterName.trim());
                            }
                        });
                    }
                });
                
                newsletterCount = newsletterSet.size;
                
                // Get last updated date - find most recent newsletterSponsored date
                let mostRecentDate = null;
                sponsors.forEach(sponsor => {
                    if (sponsor.newslettersSponsored && sponsor.newslettersSponsored.length > 0) {
                        sponsor.newslettersSponsored.forEach(n => {
                            const date = n.dateSponsored ? new Date(n.dateSponsored) : null;
                            if (date && (!mostRecentDate || date > mostRecentDate)) {
                                mostRecentDate = date;
                            }
                        });
                    }
                });
                
                if (!mostRecentDate) {
                    // Fallback to dateAdded if no newsletter dates
                    const lastSponsor = await SponsorNew.find({ status: 'approved' }).sort({ _id: -1 }).limit(1);
                    if (lastSponsor[0]) {
                        const sponsor = lastSponsor[0];
                        const idTimestamp = new Date(parseInt(sponsor._id.toString().substring(0, 8), 16) * 1000);
                        const dateAdded = sponsor.dateAdded ? new Date(sponsor.dateAdded) : null;
                        mostRecentDate = dateAdded && dateAdded > idTimestamp ? dateAdded : idTimestamp;
                    }
                }
                
                lastUpdated = mostRecentDate;
            } else {
                // Fallback to old structure if new structure is empty
                throw new Error('New structure empty, using old structure');
            }
        } catch (error) {
            // Fallback to old structure
            sponsorCompaniesCount = await Sponsor.countDocuments({ status: 'approved' });
            const newsletters = await Sponsor.distinct("newsletterSponsored", { status: 'approved' });
            newsletterCount = newsletters.filter(n => n && n.trim()).length;
            
            const lastSponsor = await Sponsor.find({ status: 'approved' }).sort({ _id: -1 }).limit(1);
            if (lastSponsor[0]) {
                const sponsor = lastSponsor[0];
                const idTimestamp = new Date(parseInt(sponsor._id.toString().substring(0, 8), 16) * 1000);
                const dateAdded = sponsor.dateAdded ? new Date(sponsor.dateAdded) : null;
                lastUpdated = dateAdded && dateAdded > idTimestamp ? dateAdded : idTimestamp;
            }
        }

        res.status(200).send({ 
            "sponsors": sponsorCompaniesCount, // Number of unique companies
            "newsletters": newsletterCount, 
            "lastUpdated": lastUpdated 
        });
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

// Create a new sponsor - uses new structure
router.post('/', auth, async (req, res) => {
    const sponsor = req.body;

    try {
        const rootDomain = sponsor.rootDomain || sponsor.sponsorLink?.replace(/^https?:\/\//, '').split('/')[0] || '';
        
        if (!rootDomain) {
            return res.status(400).send("rootDomain is required");
        }

        // Check if sponsor with same rootDomain already exists
        let existingSponsor = await SponsorNew.findOne({ rootDomain: rootDomain });
        
        if (existingSponsor) {
            // Append newsletter to existing sponsor
            const newsletterName = sponsor.newsletterSponsored || sponsor.newslettersSponsored?.[0]?.newsletterName;
            
            if (newsletterName) {
                const newsletterEntry = {
                    newsletterName: newsletterName,
                    estimatedAudience: sponsor.subscriberCount || sponsor.newslettersSponsored?.[0]?.estimatedAudience || 0,
                    contentTags: sponsor.tags || [],
                    dateSponsored: new Date(),
                    emailAddress: ''
                };
                
                // Check if newsletter already exists
                const exists = existingSponsor.newslettersSponsored.some(
                    n => n.newsletterName === newsletterName
                );
                
                if (!exists) {
                    existingSponsor.newslettersSponsored.push(newsletterEntry);
                    await existingSponsor.save();
                    console.log("Updated existing sponsor with new newsletter");
                }
            }
            
            // Update contact info if provided
            if (sponsor.sponsorEmail && !existingSponsor.sponsorEmail) {
                existingSponsor.sponsorEmail = sponsor.sponsorEmail;
                existingSponsor.contactMethod = 'email';
            }
            if (sponsor.businessContact && !existingSponsor.businessContact) {
                existingSponsor.businessContact = sponsor.businessContact;
            }
            
            await existingSponsor.save();
            const collapsed = getCollapsedSponsorsForFrontend([existingSponsor]);
            return res.status(200).send(collapsed.length > 0 ? collapsed[0] : existingSponsor);
        }

        // Create new sponsor
        const newslettersSponsored = [];
        if (sponsor.newsletterSponsored) {
            newslettersSponsored.push({
                newsletterName: sponsor.newsletterSponsored,
                estimatedAudience: sponsor.subscriberCount || 0,
                contentTags: sponsor.tags || [],
                dateSponsored: new Date(),
                emailAddress: ''
            });
        } else if (sponsor.newslettersSponsored && sponsor.newslettersSponsored.length > 0) {
            newslettersSponsored.push(...sponsor.newslettersSponsored);
        }

        const newSponsor = new SponsorNew({
            sponsorName: sponsor.sponsorName,
            sponsorLink: sponsor.sponsorLink,
            rootDomain: rootDomain,
            tags: sponsor.tags || [],
            newslettersSponsored: newslettersSponsored,
            sponsorEmail: sponsor.sponsorEmail || '',
            businessContact: sponsor.businessContact || '',
            contactMethod: sponsor.sponsorEmail ? 'email' : 'none',
            status: sponsor.status || 'pending'
        });
        
        await newSponsor.save();
        console.log("Sponsor created successfully.");

        // Delete potential sponsor if _id provided
        if (sponsor._id) {
            await PotentialSponsor.findByIdAndDelete(sponsor._id).then(() => {
                console.log("Deleted potential sponsor");
            }).catch((e) => {
                console.log("Error deleting potential sponsor", e);
            });
        }

        const collapsed = getCollapsedSponsorsForFrontend([newSponsor]);
        res.status(201).send(collapsed.length > 0 ? collapsed[0] : newSponsor);
    } catch (e) {
        console.log("Error creating sponsor", e);
        res.status(500).send("Error creating sponsor: " + e.message);
    }
});


// Get sample sponsors (8 random sponsors) - uses new structure with fallback
router.get('/sample', async (req, res) => {
    try {
        // Try SponsorNew first
        let sampleSponsors;
        try {
            sampleSponsors = await SponsorNew.aggregate([
                { $sample: { size: 8 } },
                { $project: {
                    sponsorName: 1,
                    sponsorLink: 1,
                    tags: 1,
                    newslettersSponsored: 1
                }}
            ]);
            
            // Transform to collapsed format
            sampleSponsors = sampleSponsors.map(sponsor => {
                const collapsed = getCollapsedSponsorsForFrontend([sponsor]);
                return collapsed.length > 0 ? collapsed[0] : sponsor;
            });
        } catch (error) {
            // Fallback to old structure
            sampleSponsors = await Sponsor.aggregate([
                { $sample: { size: 8 } },
                { $project: {
                    sponsorName: 1,
                    sponsorLink: 1,
                    tags: 1,
                    newsletterSponsored: 1,
                    subscriberCount: 1
                }}
            ]);
        }
        
        res.status(200).send(sampleSponsors);
    } catch (e) {
        console.log("Error getting sample sponsors", e);
        res.status(500).send("Error getting sample sponsors");
    }
});

// Update a sponsor - uses new structure with fallback
router.put('/:id', [auth, admin], async (req, res) => {
    try {
        console.log('Raw update body for sponsor', req.params.id, ':', req.body);

        // Try SponsorNew first, fallback to Sponsor
        let SponsorModel = SponsorNew;
        let sponsor = await SponsorNew.findById(req.params.id);
        
        if (!sponsor) {
            SponsorModel = Sponsor;
            sponsor = await Sponsor.findById(req.params.id);
        }
        
        if (!sponsor) {
            return res.status(404).send('The sponsor with the given ID was not found.');
        }

        // Build update object
        const updateData = {
            sponsorName: req.body.sponsorName,
            sponsorLink: req.body.sponsorLink,
            rootDomain: req.body.rootDomain,
            tags: req.body.tags,
            status: req.body.status
        };

        // Consolidate email fields - prioritize sponsorEmail, merge businessContact if it's an email
        if (req.body.sponsorEmail) {
            updateData.sponsorEmail = req.body.sponsorEmail;
            updateData.businessContact = ''; // Clear businessContact when sponsorEmail is set
        } else if (req.body.businessContact) {
            // If businessContact is an email, move it to sponsorEmail
            if (req.body.businessContact.includes('@')) {
                updateData.sponsorEmail = req.body.businessContact;
                updateData.businessContact = '';
            } else {
                // If it's not an email (legacy data), keep it in businessContact but prefer sponsorEmail from existing
                updateData.sponsorEmail = sponsor.sponsorEmail || '';
                updateData.businessContact = req.body.businessContact;
            }
        } else {
            // No email provided, clear both
            updateData.sponsorEmail = '';
            updateData.businessContact = '';
        }

        // Handle newslettersSponsored array (new format)
        if (req.body.newslettersSponsored && Array.isArray(req.body.newslettersSponsored)) {
            updateData.newslettersSponsored = req.body.newslettersSponsored;
        } else if (req.body.newsletterSponsored) {
            // Convert old format to new format
            const existingNewsletters = sponsor.newslettersSponsored || [];
            const newsletterName = req.body.newsletterSponsored.trim();
            
            // Check if newsletter already exists
            const existingIndex = existingNewsletters.findIndex(n => n.newsletterName === newsletterName);
            
            if (existingIndex >= 0) {
                // Update existing newsletter entry
                existingNewsletters[existingIndex] = {
                    newsletterName: newsletterName,
                    estimatedAudience: req.body.subscriberCount || existingNewsletters[existingIndex].estimatedAudience || 0,
                    contentTags: req.body.tags || existingNewsletters[existingIndex].contentTags || [],
                    dateSponsored: existingNewsletters[existingIndex].dateSponsored || new Date(),
                    emailAddress: existingNewsletters[existingIndex].emailAddress || ''
                };
            } else {
                // Add new newsletter entry
                existingNewsletters.push({
                    newsletterName: newsletterName,
                    estimatedAudience: req.body.subscriberCount || 0,
                    contentTags: req.body.tags || [],
                    dateSponsored: new Date(),
                    emailAddress: ''
                });
            }
            updateData.newslettersSponsored = existingNewsletters;
        }

        // Handle contactMethod
        if (req.body.contactMethod) {
            // Convert old contactMethod values to new ones
            if (req.body.contactMethod === 'email' || req.body.contactMethod === 'both') {
                updateData.contactMethod = 'email';
            } else {
                updateData.contactMethod = 'none';
            }
        } else if (updateData.sponsorEmail && updateData.sponsorEmail.trim()) {
            updateData.contactMethod = 'email';
        } else {
            updateData.contactMethod = 'none';
        }

        // Remove undefined/null values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });

        // Validation
        const validationSchema = Joi.object({
            sponsorName: Joi.string().min(2).max(256).optional(),
            sponsorLink: Joi.string().min(0).max(256).allow('').optional(),
            rootDomain: Joi.string().max(256).allow('').optional(),
            tags: Joi.array().items(Joi.string()).max(10).optional(),
            newslettersSponsored: Joi.array().items(Joi.object({
                newsletterName: Joi.string().min(2).max(256).required(),
                estimatedAudience: Joi.number().min(0),
                contentTags: Joi.array().items(Joi.string()),
                dateSponsored: Joi.date(),
                emailAddress: Joi.string().max(500).allow('')
            })).optional(),
            sponsorEmail: Joi.string().max(500).allow('').optional(),
            businessContact: Joi.string().max(500).allow('').optional(),
            contactMethod: Joi.string().valid('email', 'none').optional(),
            status: Joi.string().valid('pending', 'approved').optional()
        }).unknown(false);

        const { error } = validationSchema.validate(updateData);
        if (error) {
            console.error('Validation error:', error.details);
            return res.status(400).json({ error: 'Validation failed', details: error.details[0].message });
        }

        console.log('Updating sponsor:', req.params.id, 'with data:', updateData);

        // Check if converting to affiliate
        if (req.body.isAffiliateProgram === true) {
            console.log('Converting sponsor to affiliate...');
            const sponsorObj = sponsor.toObject ? sponsor.toObject() : sponsor;
            const rootDomain = sponsorObj.rootDomain || sponsorObj.sponsorLink?.replace(/^https?:\/\//, '').split('/')[0] || '';
            
            // Check if affiliate already exists
            let affiliate = await Affiliate.findOne({ rootDomain });
            
            if (affiliate) {
                // Update existing affiliate with newsletter info from sponsor
                const newsletters = updateData.newslettersSponsored || sponsorObj.newslettersSponsored || [];
                
                if (newsletters.length > 0) {
                    newsletters.forEach(newsletter => {
                        const exists = affiliate.affiliatedNewsletters.some(
                            n => n.newsletterName === newsletter.newsletterName
                        );
                        if (!exists) {
                            affiliate.affiliatedNewsletters.push({
                                newsletterName: newsletter.newsletterName,
                                estimatedAudience: newsletter.estimatedAudience || 0,
                                contentTags: newsletter.contentTags || [],
                                dateAffiliated: newsletter.dateSponsored || new Date(),
                                emailAddress: newsletter.emailAddress || ''
                            });
                        }
                    });
                } else if (updateData.newsletterSponsored || sponsorObj.newsletterSponsored) {
                    // Old format - add single newsletter
                    const newsletterName = updateData.newsletterSponsored || sponsorObj.newsletterSponsored;
                    const exists = affiliate.affiliatedNewsletters.some(
                        n => n.newsletterName === newsletterName
                    );
                    if (!exists) {
                        affiliate.affiliatedNewsletters.push({
                            newsletterName: newsletterName,
                            estimatedAudience: updateData.subscriberCount || sponsorObj.subscriberCount || 0,
                            contentTags: updateData.tags || sponsorObj.tags || [],
                            dateAffiliated: new Date(),
                            emailAddress: ''
                        });
                    }
                }
                
                // Merge tags
                if (updateData.tags && updateData.tags.length > 0) {
                    const existingTags = new Set(affiliate.tags || []);
                    updateData.tags.forEach(tag => existingTags.add(tag));
                    affiliate.tags = Array.from(existingTags);
                }
                
                // Update affiliate link if provided
                if (req.body.affiliateSignupLink) {
                    affiliate.affiliateLink = req.body.affiliateSignupLink;
                }
                if (req.body.commissionInfo) {
                    affiliate.commissionInfo = req.body.commissionInfo;
                }
                
                await affiliate.save();
            } else {
                // Create new affiliate
                const affiliateData = {
                    affiliateName: updateData.sponsorName || sponsorObj.sponsorName,
                    affiliateLink: req.body.affiliateSignupLink || sponsorObj.sponsorLink || '',
                    rootDomain: rootDomain,
                    tags: updateData.tags || sponsorObj.tags || [],
                    commissionInfo: req.body.commissionInfo || '',
                    status: updateData.status || sponsorObj.status || 'pending',
                    dateAdded: sponsorObj.dateAdded || new Date(),
                    interestedUsers: sponsorObj.interestedUsers || []
                };
                
                // Add newsletter info
                const newsletters = updateData.newslettersSponsored || sponsorObj.newslettersSponsored || [];
                if (newsletters.length > 0) {
                    affiliateData.affiliatedNewsletters = newsletters.map(n => ({
                        newsletterName: n.newsletterName,
                        estimatedAudience: n.estimatedAudience || 0,
                        contentTags: n.contentTags || [],
                        dateAffiliated: n.dateSponsored || new Date(),
                        emailAddress: n.emailAddress || ''
                    }));
                } else if (updateData.newsletterSponsored || sponsorObj.newsletterSponsored) {
                    affiliateData.affiliatedNewsletters = [{
                        newsletterName: updateData.newsletterSponsored || sponsorObj.newsletterSponsored,
                        estimatedAudience: updateData.subscriberCount || sponsorObj.subscriberCount || 0,
                        contentTags: updateData.tags || sponsorObj.tags || [],
                        dateAffiliated: new Date(),
                        emailAddress: ''
                    }];
                }
                
                affiliate = await Affiliate.create(affiliateData);
            }
            
            // Delete sponsor from SponsorNew or Sponsor
            await SponsorModel.findByIdAndDelete(req.params.id);
            
            console.log('Successfully converted sponsor to affiliate');
            return res.status(200).json({
                success: true,
                message: 'Sponsor converted to affiliate successfully',
                affiliate
            });
        }

        const updatedSponsor = await SponsorModel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false }
        );

        if (!updatedSponsor) {
            return res.status(404).send('Failed to update sponsor.');
        }

        console.log('Successfully updated sponsor:', updatedSponsor._id);
        // Return collapsed format
        const collapsed = getCollapsedSponsorsForFrontend([updatedSponsor]);
        res.send(collapsed.length > 0 ? collapsed[0] : updatedSponsor);
    } catch (e) {
        console.error("Error updating sponsor:", e);
        res.status(500).json({ error: "Error updating sponsor", message: e.message });
    }
});

// Mark a sponsor as viewed by a user - uses new structure with fallback
router.post('/:id/view', auth, async (req, res) => {
    try {
        console.log('View request for sponsor ID:', req.params.id);
        console.log('User ID:', req.user._id);
        
        // Try SponsorNew first, fallback to Sponsor
        let SponsorModel = SponsorNew;
        let existingSponsor = await SponsorNew.findById(req.params.id);
        
        if (!existingSponsor) {
            SponsorModel = Sponsor;
            existingSponsor = await Sponsor.findById(req.params.id);
        }
        
        if (!existingSponsor) {
            console.log('Sponsor not found with ID:', req.params.id);
            return res.status(404).send('The sponsor with the given ID was not found.');
        }
        
        const hasViewed = existingSponsor.viewedBy && existingSponsor.viewedBy.some(id => id.toString() === req.user._id.toString());
        
        console.log('Found sponsor:', existingSponsor.sponsorName);
        console.log('User has viewed:', hasViewed);
        
        if (!hasViewed) {
            const currentDate = new Date();
            const updatedSponsor = await SponsorModel.findByIdAndUpdate(
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
            
            const collapsed = getCollapsedSponsorsForFrontend([updatedSponsor], req.user._id);
            const sponsorObj = collapsed.length > 0 ? collapsed[0] : updatedSponsor.toObject();
            const isViewed = updatedSponsor.viewedBy && updatedSponsor.viewedBy.some(id => id.toString() === req.user._id.toString());
            const isApplied = updatedSponsor.appliedBy && updatedSponsor.appliedBy.some(id => id.toString() === req.user._id.toString());
            
            const userViewData = updatedSponsor.userViewDates?.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = updatedSponsor.userApplyDates?.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed: !!isViewed,
                isApplied: !!isApplied,
                dateViewed: userViewData ? userViewData.dateViewed : null,
                dateApplied: userApplyData ? userApplyData.dateApplied : null
            };

            console.log('Returning processed sponsor with isViewed:', isViewed, 'isApplied:', isApplied);
            res.send(processedSponsor);
        } else {
            console.log('User already viewed this sponsor');
            const collapsed = getCollapsedSponsorsForFrontend([existingSponsor], req.user._id);
            const sponsorObj = collapsed.length > 0 ? collapsed[0] : existingSponsor.toObject();
            const isViewed = existingSponsor.viewedBy && existingSponsor.viewedBy.some(id => id.toString() === req.user._id.toString());
            const isApplied = existingSponsor.appliedBy && existingSponsor.appliedBy.some(id => id.toString() === req.user._id.toString());
            
            const userViewData = existingSponsor.userViewDates?.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = existingSponsor.userApplyDates?.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed: !!isViewed,
                isApplied: !!isApplied,
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

// Mark a sponsor as applied by a user - uses new structure with fallback
router.post('/:id/apply', auth, async (req, res) => {
    try {
        console.log('Apply request for sponsor ID:', req.params.id);
        console.log('User ID:', req.user._id);
        
        // Try SponsorNew first, fallback to Sponsor
        let SponsorModel = SponsorNew;
        let existingSponsor = await SponsorNew.findById(req.params.id);
        
        if (!existingSponsor) {
            SponsorModel = Sponsor;
            existingSponsor = await Sponsor.findById(req.params.id);
        }
        
        if (!existingSponsor) {
            console.log('Sponsor not found with ID:', req.params.id);
            return res.status(404).send('The sponsor with the given ID was not found.');
        }
        
        const hasApplied = existingSponsor.appliedBy && existingSponsor.appliedBy.some(id => id.toString() === req.user._id.toString());
        const hasViewed = existingSponsor.viewedBy && existingSponsor.viewedBy.some(id => id.toString() === req.user._id.toString());
        
        console.log('Found sponsor:', existingSponsor.sponsorName);
        console.log('User has applied:', hasApplied);
        console.log('User has viewed:', hasViewed);
        
        const updateData = {};
        const currentDate = new Date();
        
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
        
        if (Object.keys(updateData).length > 0) {
            console.log('Updating sponsor with:', updateData);
            const updatedSponsor = await SponsorModel.findByIdAndUpdate(
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
                        contactEmail: updatedSponsor.sponsorEmail || updatedSponsor.businessContact || '',
                        dateApplied: currentDate,
                        status: 'pending',
                        lastContactDate: currentDate
                    };
                    
                    const application = new UserApplication(applicationData);
                    await application.save();
                    console.log('Created user application record:', application._id);
                } catch (appError) {
                    console.error('Error creating user application:', appError);
                }
            }
            
            const collapsed = getCollapsedSponsorsForFrontend([updatedSponsor], req.user._id);
            const sponsorObj = collapsed.length > 0 ? collapsed[0] : updatedSponsor.toObject();
            const isViewed = updatedSponsor.viewedBy && updatedSponsor.viewedBy.some(id => id.toString() === req.user._id.toString());
            const isApplied = updatedSponsor.appliedBy && updatedSponsor.appliedBy.some(id => id.toString() === req.user._id.toString());
            
            const userViewData = updatedSponsor.userViewDates?.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = updatedSponsor.userApplyDates?.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed: !!isViewed,
                isApplied: !!isApplied,
                dateViewed: userViewData ? userViewData.dateViewed : null,
                dateApplied: userApplyData ? userApplyData.dateApplied : null
            };

            console.log('Returning processed sponsor with isViewed:', isViewed, 'isApplied:', isApplied);
            res.send(processedSponsor);
        } else {
            console.log('No updates needed, user already applied and viewed');
            const collapsed = getCollapsedSponsorsForFrontend([existingSponsor], req.user._id);
            const sponsorObj = collapsed.length > 0 ? collapsed[0] : existingSponsor.toObject();
            const isViewed = existingSponsor.viewedBy && existingSponsor.viewedBy.some(id => id.toString() === req.user._id.toString());
            const isApplied = existingSponsor.appliedBy && existingSponsor.appliedBy.some(id => id.toString() === req.user._id.toString());
            
            const userViewData = existingSponsor.userViewDates?.find(d => d.user.toString() === req.user._id.toString());
            const userApplyData = existingSponsor.userApplyDates?.find(d => d.user.toString() === req.user._id.toString());
            
            const processedSponsor = {
                ...sponsorObj,
                isViewed: !!isViewed,
                isApplied: !!isApplied,
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

// Get matched sponsors for current user based on newsletter info
router.get('/matched', auth, async (req, res) => {
    try {
        // Get user with newsletter info
        const user = await User.findById(req.user._id).select('newsletterInfo');
        
        if (!user || !user.newsletterInfo || !user.newsletterInfo.topic) {
            return res.status(200).json({
                success: true,
                requiresOnboarding: true,
                message: 'Complete newsletter onboarding to see matched sponsors',
                sponsors: []
            });
        }
        
        // Get all approved sponsors
        const sponsors = await SponsorNew.find({ 
            status: 'approved',
            $or: [
                { sponsorEmail: { $exists: true, $ne: '' } },
                { businessContact: { $exists: true, $ne: '', $regex: '@' } }
            ]
        }).catch(() => {
            // Fallback to old structure
            return Sponsor.find({ 
                status: 'approved',
                $or: [
                    { sponsorEmail: { $exists: true, $ne: '' } },
                    { businessContact: { $exists: true, $ne: '', $regex: '@' } }
                ]
            });
        });
        
        // Get matched sponsors - use collapsed view (one per company)
        const matchedSponsors = getMatchedSponsors(sponsors, user.newsletterInfo, {
            limit: 20,
            minScore: 10
        });
        
        // Convert to collapsed format with most recent newsletter date
        const collapsedMatchedSponsors = getCollapsedSponsorsForFrontend(matchedSponsors, req.user._id);
        
        // Add match scores back to collapsed sponsors
        const sponsorsWithStatus = collapsedMatchedSponsors.map(sponsor => {
            const matchData = matchedSponsors.find(m => m._id.toString() === sponsor._id.toString());
            return {
                ...sponsor,
                isViewed: sponsor.isViewed || false,
                isApplied: sponsor.isApplied || false,
                matchScore: matchData?.matchScore || 0,
                matchedTags: matchData?.matchedTags || []
            };
        });
        
        res.json({
            success: true,
            sponsors: sponsorsWithStatus,
            count: sponsorsWithStatus.length
        });
        
    } catch (error) {
        console.error('Error fetching matched sponsors:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching matched sponsors',
            message: error.message
        });
    }
});

module.exports = router;