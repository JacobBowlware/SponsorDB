const express = require('express');
const router = express.Router();
const { Sponsor } = require('../models/sponsor');
const { SponsorNew } = require('../models/sponsorNew');
const { Affiliate } = require('../models/affiliate');
const admin = require('../middleware/admin');
const auth = require('../middleware/auth');

/**
 * Migration endpoint to convert existing sponsors to new structure
 * This is a safe, non-destructive migration that creates new collections
 * without modifying existing data
 */
router.post('/migrate', [auth, admin], async (req, res) => {
    try {
        console.log('🚀 Starting migration to new data structure...');
        
        // Get all existing sponsors
        const existingSponsors = await Sponsor.find({});
        console.log(`📊 Found ${existingSponsors.length} existing sponsors to migrate`);
        
        const migrationResults = {
            sponsorsCreated: 0,
            sponsorsUpdated: 0,
            affiliatesCreated: 0,
            errors: [],
            skipped: []
        };
        
        // Track sponsors by rootDomain to consolidate
        const sponsorMap = new Map();
        
        // Track affiliates separately
        const affiliateMap = new Map();

        for (const sponsor of existingSponsors) {
            try {
                const rootDomain = sponsor.rootDomain || sponsor.sponsorLink?.replace(/^https?:\/\//, '').split('/')[0] || '';
                
                // Handle affiliate programs separately
                if (sponsor.isAffiliateProgram || (sponsor.tags && sponsor.tags.includes('Affiliate'))) {
                    if (!affiliateMap.has(rootDomain)) {
                        const affiliateData = {
                            affiliateName: sponsor.sponsorName,
                            affiliateLink: sponsor.affiliateSignupLink || sponsor.sponsorLink || '',
                            rootDomain: rootDomain,
                            tags: sponsor.tags || [],
                            commissionInfo: sponsor.commissionInfo || '',
                            status: sponsor.status || 'pending',
                            dateAdded: sponsor.dateAdded || new Date(),
                            interestedUsers: sponsor.interestedUsers || []
                        };

                        // Add newsletter info if available
                        if (sponsor.newsletterSponsored) {
                            affiliateData.affiliatedNewsletters = [{
                                newsletterName: sponsor.newsletterSponsored,
                                estimatedAudience: sponsor.subscriberCount || 0,
                                contentTags: sponsor.tags || [],
                                dateAffiliated: sponsor.dateAdded || new Date(),
                                emailAddress: ''
                            }];
                        }

                        affiliateMap.set(rootDomain, affiliateData);
                    } else {
                        // Append newsletter to existing affiliate
                        const existingAffiliate = affiliateMap.get(rootDomain);
                        if (sponsor.newsletterSponsored && !existingAffiliate.affiliatedNewsletters.some(n => n.newsletterName === sponsor.newsletterSponsored)) {
                            existingAffiliate.affiliatedNewsletters.push({
                                newsletterName: sponsor.newsletterSponsored,
                                estimatedAudience: sponsor.subscriberCount || 0,
                                contentTags: sponsor.tags || [],
                                dateAffiliated: sponsor.dateAdded || new Date(),
                                emailAddress: ''
                            });
                        }
                    }
                    continue;
                }

                // Handle regular sponsors
                if (!sponsorMap.has(rootDomain)) {
                    // Create new sponsor entry
                    const sponsorData = {
                        sponsorName: sponsor.sponsorName,
                        sponsorLink: sponsor.sponsorLink || '',
                        rootDomain: rootDomain,
                        tags: sponsor.tags || [],
                        sponsorEmail: sponsor.sponsorEmail || '',
                        businessContact: sponsor.businessContact || '',
                        contactMethod: sponsor.sponsorEmail ? 'email' : 'none',
                        status: sponsor.status || 'pending',
                        dateAdded: sponsor.dateAdded || new Date(),
                        viewedBy: sponsor.viewedBy || [],
                        appliedBy: sponsor.appliedBy || [],
                        userViewDates: sponsor.userViewDates || [],
                        userApplyDates: sponsor.userApplyDates || []
                    };

                    // Add newsletter sponsorship if available
                    if (sponsor.newsletterSponsored) {
                        sponsorData.newslettersSponsored = [{
                            newsletterName: sponsor.newsletterSponsored,
                            estimatedAudience: sponsor.subscriberCount || 0,
                            contentTags: sponsor.tags || [],
                            dateSponsored: sponsor.dateAdded || new Date(),
                            emailAddress: ''
                        }];
                    }

                    sponsorMap.set(rootDomain, sponsorData);
                } else {
                    // Append newsletter to existing sponsor
                    const existingSponsor = sponsorMap.get(rootDomain);
                    if (sponsor.newsletterSponsored) {
                        const newsletterName = sponsor.newsletterSponsored.trim();
                        // Check if this newsletter is already in the array
                        const exists = existingSponsor.newslettersSponsored.some(
                            n => n.newsletterName === newsletterName
                        );
                        
                        if (!exists) {
                            existingSponsor.newslettersSponsored.push({
                                newsletterName: newsletterName,
                                estimatedAudience: sponsor.subscriberCount || 0,
                                contentTags: sponsor.tags || [],
                                dateSponsored: sponsor.dateAdded || new Date(),
                                emailAddress: ''
                            });
                        }
                    }

                    // Merge contact info if better
                    if (sponsor.sponsorEmail && !existingSponsor.sponsorEmail) {
                        existingSponsor.sponsorEmail = sponsor.sponsorEmail;
                        existingSponsor.contactMethod = 'email';
                    }
                    if (sponsor.businessContact && !existingSponsor.businessContact) {
                        existingSponsor.businessContact = sponsor.businessContact;
                    }

                    // Merge tags
                    if (sponsor.tags && sponsor.tags.length > 0) {
                        const existingTags = new Set(existingSponsor.tags || []);
                        sponsor.tags.forEach(tag => existingTags.add(tag));
                        existingSponsor.tags = Array.from(existingTags);
                    }

                    // Merge user tracking arrays
                    if (sponsor.viewedBy) {
                        const viewedSet = new Set(existingSponsor.viewedBy.map(id => id.toString()));
                        sponsor.viewedBy.forEach(id => viewedSet.add(id.toString()));
                        existingSponsor.viewedBy = Array.from(viewedSet).map(id => sponsor.viewedBy.find(v => v.toString() === id) || id);
                    }
                    if (sponsor.appliedBy) {
                        const appliedSet = new Set(existingSponsor.appliedBy.map(id => id.toString()));
                        sponsor.appliedBy.forEach(id => appliedSet.add(id.toString()));
                        existingSponsor.appliedBy = Array.from(appliedSet).map(id => sponsor.appliedBy.find(a => a.toString() === id) || id);
                    }
                }
            } catch (error) {
                console.error(`Error processing sponsor ${sponsor._id}:`, error);
                migrationResults.errors.push({
                    sponsorId: sponsor._id,
                    sponsorName: sponsor.sponsorName,
                    error: error.message
                });
            }
        }

        // Create sponsors in database
        console.log(`🏢 Creating ${sponsorMap.size} sponsors...`);
        for (const [domain, data] of sponsorMap.entries()) {
            try {
                const existing = await SponsorNew.findOne({ rootDomain: domain });
                if (!existing) {
                    await SponsorNew.create(data);
                    migrationResults.sponsorsCreated++;
                } else {
                    // Update existing sponsor with new newsletter info
                    const newslettersToAdd = data.newslettersSponsored.filter(
                        newNewsletter => !existing.newslettersSponsored.some(
                            existingNewsletter => existingNewsletter.newsletterName === newNewsletter.newsletterName
                        )
                    );
                    
                    if (newslettersToAdd.length > 0) {
                        existing.newslettersSponsored.push(...newslettersToAdd);
                        await existing.save();
                        migrationResults.sponsorsUpdated++;
                    } else {
                        migrationResults.skipped.push({
                            type: 'sponsor',
                            domain: domain,
                            reason: 'Already exists with same newsletters'
                        });
                    }
                }
            } catch (error) {
                console.error(`Error creating sponsor ${domain}:`, error);
                migrationResults.errors.push({
                    domain: domain,
                    sponsorName: data.sponsorName,
                    error: error.message
                });
            }
        }

        // Create affiliates in database
        console.log(`💰 Creating ${affiliateMap.size} affiliates...`);
        for (const [domain, data] of affiliateMap.entries()) {
            try {
                const existing = await Affiliate.findOne({ rootDomain: domain });
                if (!existing) {
                    await Affiliate.create(data);
                    migrationResults.affiliatesCreated++;
                } else {
                    // Update existing affiliate with new newsletter info
                    const newslettersToAdd = data.affiliatedNewsletters.filter(
                        newNewsletter => !existing.affiliatedNewsletters.some(
                            existingNewsletter => existingNewsletter.newsletterName === newNewsletter.newsletterName
                        )
                    );
                    
                    if (newslettersToAdd.length > 0) {
                        existing.affiliatedNewsletters.push(...newslettersToAdd);
                        await existing.save();
                    }
                }
            } catch (error) {
                console.error(`Error creating affiliate ${domain}:`, error);
                migrationResults.errors.push({
                    domain: domain,
                    affiliateName: data.affiliateName,
                    error: error.message
                });
            }
        }

        console.log('✅ Migration completed!');
        console.log('Results:', migrationResults);

        res.status(200).json({
            success: true,
            message: 'Migration completed successfully',
            results: migrationResults,
            summary: {
                totalProcessed: existingSponsors.length,
                sponsorsCreated: migrationResults.sponsorsCreated,
                sponsorsUpdated: migrationResults.sponsorsUpdated,
                affiliatesCreated: migrationResults.affiliatesCreated,
                errors: migrationResults.errors.length,
                skipped: migrationResults.skipped.length
            }
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            error: 'Migration failed',
            message: error.message
        });
    }
});

/**
 * Get migration status/preview
 */
router.get('/migrate/preview', [auth, admin], async (req, res) => {
    try {
        const existingSponsorsCount = await Sponsor.countDocuments({});
        const sponsorsNewCount = await SponsorNew.countDocuments({});
        const affiliatesCount = await Affiliate.countDocuments({});

        res.status(200).json({
            existingSponsors: existingSponsorsCount,
            newSponsors: sponsorsNewCount,
            affiliates: affiliatesCount,
            migrationNeeded: existingSponsorsCount > 0 && sponsorsNewCount === 0
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error getting migration preview',
            message: error.message
        });
    }
});

// Fix missing newsletter data - migrate from old Sponsor to SponsorNew
router.post('/fix-newsletter-data', [auth, admin], async (req, res) => {
    try {
        console.log('🔧 Starting newsletter data fix migration...');
        
        const results = {
            totalOldSponsors: 0,
            sponsorsProcessed: 0,
            newslettersAdded: 0,
            sponsorsCreated: 0,
            duplicatesSkipped: 0,
            errors: []
        };
        
        // Get all sponsors from the old collection
        const oldSponsors = await Sponsor.find({});
        results.totalOldSponsors = oldSponsors.length;
        
        console.log(`Found ${oldSponsors.length} sponsors in old collection`);
        
        for (const oldSponsor of oldSponsors) {
            try {
                // Skip if no newsletter data to migrate
                if (!oldSponsor.newsletterSponsored || oldSponsor.newsletterSponsored.trim() === '') {
                    continue;
                }
                
                // Find the corresponding sponsor in the new collection by rootDomain
                let newSponsor = await SponsorNew.findOne({ rootDomain: oldSponsor.rootDomain });
                
                if (!newSponsor) {
                    // Sponsor doesn't exist in SponsorNew - create it
                    console.log(`📝 Creating new SponsorNew for ${oldSponsor.sponsorName} (${oldSponsor.rootDomain})`);
                    
                    const sponsorData = {
                        sponsorName: oldSponsor.sponsorName,
                        sponsorLink: oldSponsor.sponsorLink || '',
                        rootDomain: oldSponsor.rootDomain || '',
                        tags: oldSponsor.tags || [],
                        sponsorEmail: oldSponsor.sponsorEmail || '',
                        businessContact: oldSponsor.businessContact || '',
                        contactMethod: (oldSponsor.sponsorEmail || oldSponsor.businessContact) ? 'email' : 'none',
                        status: oldSponsor.status || 'pending', // Keep original status
                        dateAdded: oldSponsor.dateAdded || new Date(),
                        viewedBy: oldSponsor.viewedBy || [],
                        appliedBy: oldSponsor.appliedBy || [],
                        userViewDates: oldSponsor.userViewDates || [],
                        userApplyDates: oldSponsor.userApplyDates || [],
                        newslettersSponsored: [{
                            newsletterName: oldSponsor.newsletterSponsored,
                            estimatedAudience: oldSponsor.subscriberCount || 0,
                            contentTags: oldSponsor.tags || [],
                            dateSponsored: oldSponsor.dateAdded || new Date(),
                            emailAddress: oldSponsor.sponsorEmail || oldSponsor.businessContact || ''
                        }]
                    };
                    
                    newSponsor = new SponsorNew(sponsorData);
                    await newSponsor.save();
                    
                    results.sponsorsCreated++;
                    results.newslettersAdded++;
                    results.sponsorsProcessed++;
                    console.log(`✓ Created new sponsor ${newSponsor.sponsorName} with newsletter "${oldSponsor.newsletterSponsored}"`);
                    continue;
                }
                
                // Sponsor exists - check if newsletter is already in the array
                const newsletterExists = newSponsor.newslettersSponsored.some(
                    nl => nl.newsletterName === oldSponsor.newsletterSponsored
                );
                
                if (newsletterExists) {
                    results.duplicatesSkipped++;
                    console.log(`✓ Newsletter "${oldSponsor.newsletterSponsored}" already exists for ${newSponsor.sponsorName}`);
                    results.sponsorsProcessed++;
                    continue;
                }
                
                // Add the newsletter data to newslettersSponsored array
                newSponsor.newslettersSponsored.push({
                    newsletterName: oldSponsor.newsletterSponsored,
                    estimatedAudience: oldSponsor.subscriberCount || 0,
                    contentTags: oldSponsor.tags || [],
                    dateSponsored: oldSponsor.dateAdded || new Date(),
                    emailAddress: oldSponsor.sponsorEmail || oldSponsor.businessContact || ''
                });
                
                await newSponsor.save();
                
                results.sponsorsProcessed++;
                results.newslettersAdded++;
                console.log(`✓ Added newsletter "${oldSponsor.newsletterSponsored}" to ${newSponsor.sponsorName}`);
                
            } catch (err) {
                results.errors.push({
                    sponsor: oldSponsor.sponsorName || 'Unknown',
                    rootDomain: oldSponsor.rootDomain || 'Unknown',
                    error: err.message
                });
                console.error(`Error processing ${oldSponsor.sponsorName}:`, err);
            }
        }
        
        console.log('✅ Newsletter data fix complete!');
        console.log(`Processed: ${results.sponsorsProcessed}/${results.totalOldSponsors}`);
        console.log(`Newsletters added: ${results.newslettersAdded}`);
        console.log(`New sponsors created: ${results.sponsorsCreated}`);
        console.log(`Duplicates skipped: ${results.duplicatesSkipped}`);
        
        res.status(200).json({
            success: true,
            message: 'Newsletter data fix completed',
            results
        });
        
    } catch (error) {
        console.error('Error fixing newsletter data:', error);
        res.status(500).json({
            success: false,
            error: 'Error fixing newsletter data',
            message: error.message
        });
    }
});

module.exports = router;

