const express = require('express');
const router = express.Router();
const { PotentialSponsor } = require('../models/potentialSponsor');
const { Sponsor } = require('../models/sponsor');
const { SponsorNew } = require('../models/sponsorNew');
const { DeniedSponsorLink } = require('../models/deniedSponsorLink');
const { DeniedDomain } = require('../models/deniedDomain');
const { Affiliate } = require('../models/affiliate');
const { Newsletter } = require('../models/newsletter');
const { User } = require('../models/user');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { spawn } = require('child_process');
const path = require('path');
const sendEmail = require('../utils/sendEmail');
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
            // Keep full newslettersSponsored array for reference (ensure it's always an array)
            newslettersSponsored: Array.isArray(newsletters) ? newsletters : [],
            // Count of total placements
            totalPlacements: newsletters.length || (sponsorObj.newsletterSponsored ? 1 : 0),
            // Calculate average audience size
            avgAudienceSize: newsletters.length > 0 
                ? Math.round(newsletters.reduce((sum, n) => sum + (n.estimatedAudience || 0), 0) / newsletters.length)
                : (sponsorObj.subscriberCount || 0),
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

// Migration endpoint to migrate affiliate sponsors
router.post('/migrate-affiliate-sponsors', [auth, admin], async (req, res) => {
    try {
        console.log('🔄 Starting affiliate sponsors migration...');
        
        const results = {
            totalProcessed: 0,
            migratedCount: 0,
            skippedCount: 0,
            errors: 0,
            details: []
        };

        // Find all sponsors with "Affiliate" in their tags
        const affiliateSponsors = await Sponsor.find({
            tags: { $in: ['Affiliate'] }
        });
        
        console.log(`📊 Found ${affiliateSponsors.length} sponsors with "Affiliate" tag`);
        results.totalProcessed = affiliateSponsors.length;
        
        if (affiliateSponsors.length === 0) {
            console.log('✅ No affiliate sponsors found to migrate');
            return res.status(200).json({
                success: true,
                message: 'No affiliate sponsors found to migrate',
                results
            });
        }
        
        for (const sponsor of affiliateSponsors) {
            try {
                console.log(`Processing: ${sponsor.sponsorName}`);
                
                const updateFields = {
                    isAffiliateProgram: true
                };
                
                // Check if businessContact exists and is a URL
                if (sponsor.businessContact && sponsor.businessContact.trim() !== '') {
                    const businessContact = sponsor.businessContact.trim();
                    
                    // Check if it's a URL
                    const isUrl = (string) => {
                        try {
                            new URL(string);
                            return true;
                        } catch (_) {
                            return false;
                        }
                    };
                    
                    if (isUrl(businessContact)) {
                        // Move to affiliateSignupLink
                        updateFields.affiliateSignupLink = businessContact;
                        console.log(`  📎 Moved businessContact to affiliateSignupLink: ${businessContact}`);
                        results.details.push({
                            sponsor: sponsor.sponsorName,
                            action: 'moved_businessContact_to_affiliateSignupLink',
                            value: businessContact
                        });
                    } else if (businessContact.includes('@')) {
                        // It's an email, move to sponsorEmail if not already set
                        if (!sponsor.sponsorEmail) {
                            updateFields.sponsorEmail = businessContact;
                            console.log(`  📧 Moved businessContact email to sponsorEmail: ${businessContact}`);
                            results.details.push({
                                sponsor: sponsor.sponsorName,
                                action: 'moved_businessContact_email_to_sponsorEmail',
                                value: businessContact
                            });
                        } else {
                            console.log(`  📧 Keeping businessContact as email: ${businessContact}`);
                            results.details.push({
                                sponsor: sponsor.sponsorName,
                                action: 'kept_businessContact_as_email',
                                value: businessContact
                            });
                        }
                    } else {
                        // Keep as businessContact if it's not a URL or email
                        console.log(`  📝 Keeping businessContact as is: ${businessContact}`);
                        results.details.push({
                            sponsor: sponsor.sponsorName,
                            action: 'kept_businessContact_as_is',
                            value: businessContact
                        });
                    }
                }
                
                // Update the sponsor
                const result = await Sponsor.findByIdAndUpdate(
                    sponsor._id,
                    { $set: updateFields },
                    { new: true }
                );
                
                if (result) {
                    results.migratedCount++;
                    console.log(`  ✅ Updated successfully\n`);
                } else {
                    results.skippedCount++;
                    console.log(`  ⚠️  Failed to update\n`);
                    results.details.push({
                        sponsor: sponsor.sponsorName,
                        action: 'failed_to_update',
                        error: 'Database update failed'
                    });
                }
                
            } catch (error) {
                results.errors++;
                console.error(`❌ Error processing ${sponsor.sponsorName}:`, error);
                results.details.push({
                    sponsor: sponsor.sponsorName,
                    action: 'error',
                    error: error.message
                });
            }
        }
        
        console.log('📈 Migration Summary:');
        console.log(`  ✅ Successfully migrated: ${results.migratedCount} sponsors`);
        console.log(`  ⚠️  Skipped: ${results.skippedCount} sponsors`);
        console.log(`  ❌ Errors: ${results.errors} sponsors`);
        console.log(`  📊 Total processed: ${results.totalProcessed} sponsors`);
        
        res.status(200).json({
            success: true,
            message: 'Affiliate sponsors migration completed',
            results
        });
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

// Migration endpoint to update sponsor analysis status
router.post('/migrate-sponsor-status', [auth, admin], async (req, res) => {
    try {
        console.log('Starting sponsor analysis status migration...');
        
        const results = {
            totalProcessed: 0,
            updatedToPending: 0,
            updatedToComplete: 0,
            errors: 0,
            details: []
        };

        const processCollection = async (Model, collectionName) => {
            console.log(`\nProcessing ${collectionName} collection...`);
            const sponsors = await Model.find({});
            console.log(`Found ${sponsors.length} ${collectionName} to review`);
            
            for (const sponsor of sponsors) {
                results.totalProcessed++;
                try {
                    // Ensure all sponsors have the required fields (add if missing)
                    let updateFields = {};
                    
                    // Add missing fields if they don't exist
                    if (!sponsor.hasOwnProperty('sponsorEmail')) {
                        updateFields.sponsorEmail = '';
                    }
                    if (!sponsor.hasOwnProperty('sponsorApplication')) {
                        updateFields.sponsorApplication = '';
                    }
                    if (!sponsor.hasOwnProperty('contactMethod')) {
                        updateFields.contactMethod = 'none';
                    }
                    if (!sponsor.hasOwnProperty('analysisStatus')) {
                        updateFields.analysisStatus = 'pending';
                    }

                    // Check for contact info in both old and new fields
                    const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
                    const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';
                    const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';

                    let newAnalysisStatus = sponsor.analysisStatus || 'pending';
                    let newContactMethod = sponsor.contactMethod || 'none';

                    // Determine contact method and status
                    if (hasEmail && hasApplication) {
                        newContactMethod = 'both';
                        newAnalysisStatus = 'complete';
                    } else if (hasEmail) {
                        newContactMethod = 'email';
                        newAnalysisStatus = 'complete';
                    } else if (hasApplication) {
                        newContactMethod = 'application';
                        newAnalysisStatus = 'complete';
                    } else if (hasBusinessContact) {
                        // Handle legacy businessContact field
                        if (sponsor.businessContact.includes('@')) {
                            newContactMethod = 'email';
                            newAnalysisStatus = 'complete';
                            // Migrate businessContact to sponsorEmail
                            updateFields.sponsorEmail = sponsor.businessContact;
                        } else {
                            newContactMethod = 'application';
                            newAnalysisStatus = 'complete';
                            // Migrate businessContact to sponsorApplication
                            updateFields.sponsorApplication = sponsor.businessContact;
                        }
                    } else {
                        newContactMethod = 'none';
                        newAnalysisStatus = 'pending';
                    }

                    // Always update analysisStatus and contactMethod based on actual contact info
                    updateFields.analysisStatus = newAnalysisStatus;
                    updateFields.contactMethod = newContactMethod;

                    // Always update to ensure all sponsors have the same structure
                    const updateData = {
                        analysisStatus: newAnalysisStatus,
                        contactMethod: newContactMethod,
                        ...updateFields
                    };

                    await Model.findByIdAndUpdate(sponsor._id, {
                        $set: updateData
                    });
                    
                    if (newAnalysisStatus === 'pending') {
                        results.updatedToPending++;
                    } else {
                        results.updatedToComplete++;
                    }
                    
                    results.details.push({
                        id: sponsor._id,
                        name: sponsor.sponsorName,
                        oldStatus: sponsor.analysisStatus || 'unknown',
                        newStatus: newAnalysisStatus,
                        oldContactMethod: sponsor.contactMethod || 'unknown',
                        newContactMethod: newContactMethod,
                        migratedFields: Object.keys(updateFields),
                        message: 'Status and/or contact method updated'
                    });
                    
                    console.log(`Updated ${sponsor.sponsorName}: ${sponsor.analysisStatus || 'unknown'} -> ${newAnalysisStatus}, contact: ${sponsor.contactMethod || 'unknown'} -> ${newContactMethod}`);
                    if (Object.keys(updateFields).length > 0) {
                        console.log(`  Migrated fields: ${Object.keys(updateFields).join(', ')}`);
                    }
                } catch (error) {
                    results.errors++;
                    results.details.push({
                        id: sponsor._id,
                        name: sponsor.sponsorName,
                        error: error.message,
                        message: 'Error processing sponsor'
                    });
                    console.error(`Error processing sponsor ${sponsor._id}:`, error);
                }
            }
        };

        await processCollection(Sponsor, 'Sponsor');
        await processCollection(PotentialSponsor, 'PotentialSponsor');
        
        console.log('\n=== Migration Results ===');
        console.log(`Total sponsors processed: ${results.totalProcessed}`);
        console.log(`Updated to pending: ${results.updatedToPending}`);
        console.log(`Updated to complete: ${results.updatedToComplete}`);
        console.log(`Errors: ${results.errors}`);
        console.log('Migration completed successfully!');
        
        res.json({
            success: true,
            message: 'Migration completed successfully',
            results: results
        });
        
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

// Get user analytics for admin dashboard
router.get('/user-analytics', [auth, admin], async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Current user count (all users)
        const totalUsers = await User.countDocuments({});
        
        // Users created today - using ObjectId timestamp
        // ObjectId contains timestamp in first 4 bytes (first 8 hex chars)
        const todayTimestamp = Math.floor(startOfToday.getTime() / 1000);
        const todayId = new mongoose.Types.ObjectId(todayTimestamp.toString(16).padStart(8, '0') + '0000000000000000');
        const usersToday = await User.countDocuments({
            _id: { $gte: todayId }
        });
        
        // Signups this month (users created this month)
        const monthTimestamp = Math.floor(startOfMonth.getTime() / 1000);
        const monthId = new mongoose.Types.ObjectId(monthTimestamp.toString(16).padStart(8, '0') + '0000000000000000');
        const signupsThisMonth = await User.countDocuments({
            _id: { $gte: monthId }
        });
        
        // Users with active subscriptions (premium)
        const activeSubscribers = await User.countDocuments({
            subscription: { $in: ['premium', 'basic'] }
        });
        
        // Newsletter subscribers count
        const { NewsletterSubscriber } = require('../models/newsletterSubscriber');
        const newsletterSubscribers = await NewsletterSubscriber.countDocuments({
            isActive: true
        });
        
        // Also count users who have newsletterOptIn = true
        const usersWithNewsletterOptIn = await User.countDocuments({
            newsletterOptIn: true
        });
        
        // Total newsletter subscribers (from both collections, deduplicated)
        // Since users can be in both, we'll just sum them (with note that there might be overlap)
        // In practice, NewsletterSubscriber emails should be merged into User when they sign up
        const totalNewsletterSubscribers = newsletterSubscribers + usersWithNewsletterOptIn;
        
        // Calculate conversion ratio (users with subscription / total users)
        const conversionRate = totalUsers > 0 ? ((activeSubscribers / totalUsers) * 100).toFixed(1) : '0.0';
        
        // Monthly signup data for the last 12 months
        const monthlySignups = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            
            // Use ObjectId timestamp range for accurate counting
            const startTimestamp = Math.floor(monthStart.getTime() / 1000);
            const endTimestamp = Math.floor(monthEnd.getTime() / 1000);
            
            const startId = new mongoose.Types.ObjectId(startTimestamp.toString(16).padStart(8, '0') + '0000000000000000');
            const endId = new mongoose.Types.ObjectId(endTimestamp.toString(16).padStart(8, '0') + 'FFFFFFFFFFFFFFFF');
            
            const count = await User.countDocuments({
                _id: {
                    $gte: startId,
                    $lte: endId
                }
            });
            
            monthlySignups.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                year: monthStart.getFullYear(),
                monthNum: monthStart.getMonth() + 1,
                count: count
            });
        }
        
        // Users created vs users with subscriptions (for conversion tracking)
        const usersCreated = totalUsers;
        const usersWithSubscription = activeSubscribers;
        const usersWithoutSubscription = totalUsers - activeSubscribers;
        
        res.json({
            success: true,
            totalUsers,
            usersToday,
            signupsThisMonth,
            activeSubscribers,
            paidUsers: activeSubscribers, // Alias for clarity
            newsletterSubscribers: totalNewsletterSubscribers,
            conversionRate: parseFloat(conversionRate),
            usersWithoutSubscription,
            monthlySignups
        });
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user analytics',
            message: error.message
        });
    }
});

router.get('/stats', [auth, admin], async (req, res) => {
    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Get total sponsors (approved) - try new structure first
        let totalSponsors = 0;
        let sponsorsWithContactInfo = 0;
        let approvedSponsors = 0;
        let reviewedSponsors = 0;
        let totalViews = 0;
        let totalApplications = 0;
        
        try {
            totalSponsors = await SponsorNew.countDocuments({ status: 'approved' });
            sponsorsWithContactInfo = await SponsorNew.countDocuments({
                status: 'approved',
                $or: [
                    { sponsorEmail: { $exists: true, $ne: '' } },
                    { businessContact: { $exists: true, $ne: '' } }
                ]
            });
            approvedSponsors = await SponsorNew.countDocuments({ status: 'approved' });
            reviewedSponsors = await SponsorNew.countDocuments({
                viewedBy: { $exists: true, $ne: [] }
            });
            
            const sponsorsWithViews = await SponsorNew.find({ viewedBy: { $exists: true, $ne: [] } });
            totalViews = sponsorsWithViews.reduce((sum, sponsor) => sum + (sponsor.viewedBy?.length || 0), 0);
            
            const sponsorsWithApplications = await SponsorNew.find({ appliedBy: { $exists: true, $ne: [] } });
            totalApplications = sponsorsWithApplications.reduce((sum, sponsor) => sum + (sponsor.appliedBy?.length || 0), 0);
        } catch (error) {
            // Fallback to old structure
            totalSponsors = await Sponsor.countDocuments();
            sponsorsWithContactInfo = await Sponsor.countDocuments({
                $or: [
                    { sponsorEmail: { $exists: true, $ne: '' } },
                    { sponsorApplication: { $exists: true, $ne: '' } },
                    { businessContact: { $exists: true, $ne: '' } }
                ]
            });
            approvedSponsors = await Sponsor.countDocuments();
            reviewedSponsors = await Sponsor.countDocuments({
                viewedBy: { $exists: true, $ne: [] }
            });
            
            const sponsorsWithViews = await Sponsor.find({ viewedBy: { $exists: true, $ne: [] } });
            totalViews = sponsorsWithViews.reduce((sum, sponsor) => sum + sponsor.viewedBy.length, 0);
            
            const sponsorsWithApplications = await Sponsor.find({ appliedBy: { $exists: true, $ne: [] } });
            totalApplications = sponsorsWithApplications.reduce((sum, sponsor) => sum + sponsor.appliedBy.length, 0);
        }
        
        // Get total sponsors (approved)
        // const totalSponsors = await Sponsor.countDocuments();
        
        // Get sponsors with contact info (for public display)
        // const sponsorsWithContactInfo = await Sponsor.countDocuments({
        //     $or: [
        //         { sponsorEmail: { $exists: true, $ne: '' } },
        //         { sponsorApplication: { $exists: true, $ne: '' } },
        //         { businessContact: { $exists: true, $ne: '' } }
        //     ]
        // });
        
        // Get sponsors scraped this week
        const scrapedThisWeek = await PotentialSponsor.countDocuments({
            dateAdded: { $gte: oneWeekAgo }
        });
        
        // Get pending review count (both collections)
        const pendingPotential = await PotentialSponsor.countDocuments({
            analysisStatus: { $in: ['manual_review_required', 'pending'] }
        });
        const pendingSponsors = await Sponsor.countDocuments({
            analysisStatus: { $in: ['manual_review_required', 'pending'] }
        });
        const pendingReview = pendingPotential + pendingSponsors;
        
        // Calculate success rate (approved vs total processed)
        const totalProcessed = await PotentialSponsor.countDocuments();
        const totalApproved = await Sponsor.countDocuments();
        const totalDenied = await DeniedSponsorLink.countDocuments();
        const successRate = totalProcessed > 0 ? Math.round((totalApproved / (totalApproved + totalDenied)) * 100) : 0;
        
        // Get additional stats
        // const approvedSponsors = await Sponsor.countDocuments();
        const rejectedSponsors = await DeniedSponsorLink.countDocuments();
        // const reviewedSponsors = await Sponsor.countDocuments({
        //     viewedBy: { $exists: true, $ne: [] }
        // });
        
        // Get total views and applications
        // const sponsorsWithViews = await Sponsor.find({ viewedBy: { $exists: true, $ne: [] } });
        // const totalViews = sponsorsWithViews.reduce((sum, sponsor) => sum + sponsor.viewedBy.length, 0);
        
        // const sponsorsWithApplications = await Sponsor.find({ appliedBy: { $exists: true, $ne: [] } });
        // const totalApplications = sponsorsWithApplications.reduce((sum, sponsor) => sum + sponsor.appliedBy.length, 0);

        // Get weekly data for the last 8 weeks
        const weeklyData = [];
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i * 7 + 6) * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - (i * 7) * 24 * 60 * 60 * 1000);
            
            const weekCount = await SponsorNew.countDocuments({
                dateAdded: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
            }).catch(() => {
                return Sponsor.countDocuments({
                    dateAdded: {
                        $gte: weekStart,
                        $lte: weekEnd
                    }
                });
            });
            
            const weekLabel = weekStart.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            weeklyData.push({
                week: weekLabel,
                count: weekCount
            });
        }

        const stats = {
            totalSponsors,
            sponsorsWithContactInfo,
            pendingReview: scrapedThisWeek,
            addedThisWeek: scrapedThisWeek,
            lastScraperRun: new Date().toLocaleString(),
            weeklyData
        };
        
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ error: 'Error getting admin stats' });
    }
});

// Get all sponsors for admin (both pending and approved)
router.get('/sponsors/all', [auth, admin], async (req, res) => {
    try {
        const { page = 1, limit = 50, sortBy = 'dateAdded', sortOrder = 'desc', search = '', filter = 'all', status = 'all', affiliateOnly = 'false' } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Only query the main Sponsor collection (Test > Sponsors in MongoDB)
        let query = {};
        
        // Apply search filter
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { sponsorName: searchRegex },
                { newsletterSponsored: searchRegex },
                { rootDomain: searchRegex }
            ];
        }
        
        // Apply confidence filter
        if (filter !== 'all') {
            switch (filter) {
                case 'high':
                    query.confidence = { $gte: 85 };
                    break;
                case 'medium':
                    query.confidence = { $gte: 70, $lt: 85 };
                    break;
                case 'low':
                    query.confidence = { $lt: 70 };
                    break;
                case 'has-contact':
                    query.$or = [
                        { sponsorEmail: { $exists: true, $ne: '', $ne: null } },
                        { sponsorApplication: { $exists: true, $ne: '', $ne: null } },
                        { affiliateSignupLink: { $exists: true, $ne: '', $ne: null } },
                        { businessContact: { $exists: true, $ne: '', $ne: null } }
                    ];
                    break;
            }
        }
        
        // Apply status filter (updated for new status system)
        if (status !== 'all' && status !== '') {
            switch (status) {
                case 'approved':
                    query.status = 'approved';
                    break;
                case 'pending':
                    query.status = 'pending';
                    break;
                // Note: 'with_contact' and 'no_contact' filters are handled client-side
                // since they require complex contact info detection logic
            }
        }
        
        // Apply affiliate program filter
        if (affiliateOnly === 'true') {
            query.isAffiliateProgram = true;
        }
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Query SponsorNew first, fallback to Sponsor
        let sponsors, total;
        try {
            // Update search to include newslettersSponsored array
            if (search) {
                const searchRegex = { $regex: search, $options: 'i' };
                query.$or = [
                    { sponsorName: searchRegex },
                    { rootDomain: searchRegex },
                    { 'newslettersSponsored.newsletterName': searchRegex }
                ];
            }
            
            // Update contact filter for new structure
            if (filter === 'has-contact') {
                query.$or = [
                    { sponsorEmail: { $exists: true, $ne: '', $ne: null } },
                    { businessContact: { $exists: true, $ne: '', $ne: null } }
                ];
            }
            
            sponsors = await SponsorNew.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));
            
            total = await SponsorNew.countDocuments(query);
        } catch (error) {
            // Fallback to old structure
            if (search) {
                const searchRegex = { $regex: search, $options: 'i' };
                query.$or = [
                    { sponsorName: searchRegex },
                    { newsletterSponsored: searchRegex },
                    { rootDomain: searchRegex }
                ];
            }
            
            if (filter === 'has-contact') {
                query.$or = [
                    { sponsorEmail: { $exists: true, $ne: '', $ne: null } },
                    { sponsorApplication: { $exists: true, $ne: '', $ne: null } },
                    { affiliateSignupLink: { $exists: true, $ne: '', $ne: null } },
                    { businessContact: { $exists: true, $ne: '', $ne: null } }
                ];
            }
            
            sponsors = await Sponsor.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));
            
            total = await Sponsor.countDocuments(query);
        }
        
        // Return collapsed view (one per company) sorted by most recent newsletter date
        const collapsedSponsors = getCollapsedSponsorsForFrontend(sponsors);
        
        // Sort by dateSponsored (most recent first) for admin table
        collapsedSponsors.sort((a, b) => {
            const dateA = new Date(a.dateSponsored || a.dateAdded || 0);
            const dateB = new Date(b.dateSponsored || b.dateAdded || 0);
            return dateB - dateA; // Descending order
        });
        
        // Apply pagination to collapsed results
        const paginatedSponsors = collapsedSponsors.slice(skip, skip + parseInt(limit));
        const totalCollapsed = collapsedSponsors.length;
        
        // Debug logging
        console.log(`Admin query: Found ${sponsors.length} sponsors, collapsed to ${totalCollapsed} records`);
        
        res.status(200).json({
            sponsors: paginatedSponsors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCollapsed,
                pages: Math.ceil(totalCollapsed / limit)
            }
        });
    } catch (error) {
        console.error('Error getting all sponsors:', error);
        res.status(500).json({ error: 'Error getting all sponsors' });
    }
});

// Get all affiliates for admin
router.get('/affiliates/all', [auth, admin], async (req, res) => {
    try {
        const { page = 1, limit = 50, sortBy = 'dateAdded', sortOrder = 'desc', search = '', status = 'all' } = req.query;
        
        const skip = (page - 1) * limit;
        
        let query = {};
        
        // Apply search filter
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { affiliateName: searchRegex },
                { rootDomain: searchRegex },
                { 'affiliatedNewsletters.newsletterName': searchRegex }
            ];
        }
        
        // Apply status filter
        if (status !== 'all' && status !== '') {
            query.status = status;
        }
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const affiliates = await Affiliate.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Affiliate.countDocuments(query);
        
        res.status(200).json({
            affiliates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting all affiliates:', error);
        res.status(500).json({ error: 'Error getting all affiliates' });
    }
});

// Convert sponsor to affiliate
router.post('/sponsors/:id/convert-to-affiliate', [auth, admin], async (req, res) => {
    try {
        const sponsorId = req.params.id;
        
        // Find sponsor in SponsorNew first, fallback to Sponsor
        let sponsor = await SponsorNew.findById(sponsorId);
        let useNewStructure = true;
        
        if (!sponsor) {
            sponsor = await Sponsor.findById(sponsorId);
            useNewStructure = false;
        }
        
        if (!sponsor) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }
        
        const sponsorObj = sponsor.toObject ? sponsor.toObject() : sponsor;
        const rootDomain = sponsorObj.rootDomain || sponsorObj.sponsorLink?.replace(/^https?:\/\//, '').split('/')[0] || '';
        
        // Check if affiliate already exists
        let affiliate = await Affiliate.findOne({ rootDomain });
        
        if (affiliate) {
            // Update existing affiliate with newsletter info from sponsor
            const newsletters = sponsorObj.newslettersSponsored || [];
            
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
            } else if (sponsorObj.newsletterSponsored) {
                // Old format - add single newsletter
                const exists = affiliate.affiliatedNewsletters.some(
                    n => n.newsletterName === sponsorObj.newsletterSponsored
                );
                if (!exists) {
                    affiliate.affiliatedNewsletters.push({
                        newsletterName: sponsorObj.newsletterSponsored,
                        estimatedAudience: sponsorObj.subscriberCount || 0,
                        contentTags: sponsorObj.tags || [],
                        dateAffiliated: sponsorObj.dateAdded || new Date(),
                        emailAddress: ''
                    });
                }
            }
            
            // Merge tags
            if (sponsorObj.tags && sponsorObj.tags.length > 0) {
                const existingTags = new Set(affiliate.tags || []);
                sponsorObj.tags.forEach(tag => existingTags.add(tag));
                affiliate.tags = Array.from(existingTags);
            }
            
            await affiliate.save();
        } else {
            // Create new affiliate
            const affiliateData = {
                affiliateName: sponsorObj.sponsorName,
                affiliateLink: sponsorObj.sponsorLink || '',
                rootDomain: rootDomain,
                tags: sponsorObj.tags || [],
                commissionInfo: sponsorObj.commissionInfo || '',
                status: sponsorObj.status || 'pending',
                dateAdded: sponsorObj.dateAdded || new Date(),
                interestedUsers: sponsorObj.interestedUsers || []
            };
            
            // Add newsletter info
            const newsletters = sponsorObj.newslettersSponsored || [];
            if (newsletters.length > 0) {
                affiliateData.affiliatedNewsletters = newsletters.map(n => ({
                    newsletterName: n.newsletterName,
                    estimatedAudience: n.estimatedAudience || 0,
                    contentTags: n.contentTags || [],
                    dateAffiliated: n.dateSponsored || new Date(),
                    emailAddress: n.emailAddress || ''
                }));
            } else if (sponsorObj.newsletterSponsored) {
                affiliateData.affiliatedNewsletters = [{
                    newsletterName: sponsorObj.newsletterSponsored,
                    estimatedAudience: sponsorObj.subscriberCount || 0,
                    contentTags: sponsorObj.tags || [],
                    dateAffiliated: sponsorObj.dateAdded || new Date(),
                    emailAddress: ''
                }];
            }
            
            affiliate = await Affiliate.create(affiliateData);
        }
        
        // Delete sponsor from SponsorNew or Sponsor
        if (useNewStructure) {
            await SponsorNew.findByIdAndDelete(sponsorId);
        } else {
            await Sponsor.findByIdAndDelete(sponsorId);
        }
        
        res.status(200).json({
            success: true,
            message: 'Sponsor converted to affiliate successfully',
            affiliate
        });
    } catch (error) {
        console.error('Error converting sponsor to affiliate:', error);
        res.status(500).json({ error: 'Error converting sponsor to affiliate', message: error.message });
    }
});

// Get pending sponsors for review
router.get('/sponsors/pending', [auth, admin], async (req, res) => {
    try {
        const { page = 1, limit = 50, sortBy = 'confidence', sortOrder = 'desc', search = '', filter = 'all' } = req.query;
        
        const skip = (page - 1) * limit;
        
        // Build query
        let query = {};
        
        // Apply search filter
        if (search) {
            query.$or = [
                { sponsorName: { $regex: search, $options: 'i' } },
                { newsletterSponsored: { $regex: search, $options: 'i' } },
                { rootDomain: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Apply confidence filter
        if (filter !== 'all') {
            switch (filter) {
                case 'high':
                    query.confidence = { $gte: 85 };
                    break;
                case 'medium':
                    query.confidence = { $gte: 70, $lt: 85 };
                    break;
                case 'low':
                    query.confidence = { $lt: 70 };
                    break;
                case 'has-contact':
                    query.businessContact = { $exists: true, $ne: '' };
                    break;
            }
        }
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const sponsors = await PotentialSponsor.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await PotentialSponsor.countDocuments(query);
        
        res.status(200).json({
            sponsors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting pending sponsors:', error);
        res.status(500).json({ error: 'Error getting pending sponsors' });
    }
});

// Bulk actions for sponsors
router.post('/sponsors/bulk-action', [auth, admin], async (req, res) => {
    try {
        const { action, sponsorIds } = req.body;
        
        console.log('Admin bulk-action: Received request:', { action, sponsorIds, count: sponsorIds?.length });
        
        if (!action || !sponsorIds || !Array.isArray(sponsorIds)) {
            console.log('Admin bulk-action: Invalid request data');
            return res.status(400).json({ error: 'Invalid request data' });
        }
        
        let result;
        
        // Convert string IDs to ObjectIds for all operations
        const objectIds = sponsorIds.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (error) {
                console.error(`Invalid ObjectId: ${id}`);
                return null;
            }
        }).filter(id => id !== null);
        
        if (objectIds.length === 0) {
            return res.status(400).json({ error: 'No valid sponsor IDs provided' });
        }
        
        console.log(`Admin bulk-action: Converted ${objectIds.length} valid ObjectIds from ${sponsorIds.length} provided IDs`);
        
        switch (action) {
            case 'approve':
                console.log('Admin bulk-action: Processing approve action for', objectIds.length, 'sponsors');
                
                // Check both collections for sponsors to approve
                const [potentialSponsorsToApprove, alreadyApprovedSponsors] = await Promise.all([
                    PotentialSponsor.find({ _id: { $in: objectIds } }),
                    Sponsor.find({ _id: { $in: objectIds } })
                ]);
                
                console.log('Admin bulk-action: Found', potentialSponsorsToApprove.length, 'potential sponsors to approve');
                console.log('Admin bulk-action: Found', alreadyApprovedSponsors.length, 'already approved sponsors');
                
                if (potentialSponsorsToApprove.length === 0 && alreadyApprovedSponsors.length === 0) {
                    console.log('Admin bulk-action: No sponsors found to approve in either collection');
                    return res.status(404).json({ error: 'No sponsors found to approve' });
                }
                
                let approvedCount = 0;
                
                // Process potential sponsors (move to approved)
                if (potentialSponsorsToApprove.length > 0) {
                    const approvedSponsors = potentialSponsorsToApprove.map(sponsor => ({
                        sponsorName: sponsor.sponsorName,
                        sponsorLink: sponsor.sponsorLink,
                        rootDomain: sponsor.rootDomain,
                        tags: sponsor.tags,
                        newsletterSponsored: sponsor.newsletterSponsored,
                        subscriberCount: sponsor.subscriberCount,
                        businessContact: sponsor.businessContact,
                        sponsorEmail: sponsor.sponsorEmail || '',
                        sponsorApplication: sponsor.sponsorApplication || '',
                        contactMethod: sponsor.contactMethod || 'none',
                        isAffiliateProgram: sponsor.isAffiliateProgram || false,
                        affiliateSignupLink: sponsor.affiliateSignupLink || '',
                        commissionInfo: sponsor.commissionInfo || '',
                        status: 'approved',  // Set status to approved
                        analysisStatus: 'complete'  // Set analysis status to complete
                    }));
                    
                    console.log('Admin bulk-action: Inserting', approvedSponsors.length, 'sponsors into approved collection');
                    await Sponsor.insertMany(approvedSponsors);
                    
                    console.log('Admin bulk-action: Deleting', potentialSponsorsToApprove.length, 'sponsors from potential collection');
                    await PotentialSponsor.deleteMany({ _id: { $in: potentialSponsorsToApprove.map(s => s._id) } });
                    
                    approvedCount += potentialSponsorsToApprove.length;
                }
                
                // Process already approved sponsors (just update status if needed)
                if (alreadyApprovedSponsors.length > 0) {
                    console.log('Admin bulk-action: Updating', alreadyApprovedSponsors.length, 'already approved sponsors');
                    await Sponsor.updateMany(
                        { _id: { $in: alreadyApprovedSponsors.map(s => s._id) } },
                        { $set: { status: 'approved', analysisStatus: 'complete' } }
                    );
                    approvedCount += alreadyApprovedSponsors.length;
                }
                
                result = { message: `Approved ${approvedCount} sponsors` };
                console.log('Admin bulk-action: Approve action completed successfully');
                break;
                
            case 'reject': {
                console.log('Admin bulk-action: Starting REJECT action for', objectIds.length, 'sponsor(s)');
                console.log('Admin bulk-action: ObjectIds to reject:', objectIds.map(id => id.toString()));
                
                // Check all collections to find sponsors to reject
                const [foundInPotential, foundInSponsors, foundInSponsorsNew] = await Promise.all([
                    PotentialSponsor.find({ _id: { $in: objectIds } }).select('_id sponsorName rootDomain'),
                    Sponsor.find({ _id: { $in: objectIds } }).select('_id sponsorName rootDomain'),
                    SponsorNew.find({ _id: { $in: objectIds } }).select('_id sponsorName rootDomain')
                ]);
                
                console.log('Admin bulk-action: Found in PotentialSponsor:', foundInPotential.length, foundInPotential.map(s => ({ id: s._id.toString(), name: s.sponsorName, domain: s.rootDomain })));
                console.log('Admin bulk-action: Found in Sponsor:', foundInSponsors.length, foundInSponsors.map(s => ({ id: s._id.toString(), name: s.sponsorName, domain: s.rootDomain })));
                console.log('Admin bulk-action: Found in SponsorNew:', foundInSponsorsNew.length, foundInSponsorsNew.map(s => ({ id: s._id.toString(), name: s.sponsorName, domain: s.rootDomain })));
                
                const allSponsorsToReject = [...foundInPotential, ...foundInSponsors, ...foundInSponsorsNew];
                
                if (allSponsorsToReject.length === 0) {
                    console.warn('Admin bulk-action: WARNING - No sponsors found to reject in any collection!');
                    result = { message: 'Rejected 0 sponsors (none found)' };
                    break;
                }
                
                // Extract domains and add to denied list (only if not already denied)
                let domainsAdded = 0;
                for (const sponsor of allSponsorsToReject) {
                    if (sponsor.rootDomain) {
                        const rootDomain = sponsor.rootDomain.toLowerCase();
                        
                        // Check if domain is already denied
                        const alreadyDenied = await DeniedDomain.findOne({ rootDomain });
                        
                        // Only add to denied list if not already there
                        if (!alreadyDenied) {
                            await DeniedDomain.create({
                                rootDomain,
                                reason: 'Bulk rejected by admin',
                                dateAdded: new Date(),
                                addedBy: 'admin'
                            });
                            domainsAdded++;
                            console.log(`Admin bulk-action: Added domain ${rootDomain} to denied list`);
                        } else {
                            console.log(`Admin bulk-action: Domain ${rootDomain} already in denied list`);
                        }
                    }
                }
                
                console.log(`Admin bulk-action: Added ${domainsAdded} new domains to denied list`);
                
                // Delete from all collections
                console.log('Admin bulk-action: Attempting to delete from PotentialSponsor...');
                const deletedFromPotential = await PotentialSponsor.deleteMany({ _id: { $in: objectIds } });
                console.log('Admin bulk-action: PotentialSponsor deletion result:', { deletedCount: deletedFromPotential.deletedCount });
                
                console.log('Admin bulk-action: Attempting to delete from Sponsor...');
                const deletedFromSponsors = await Sponsor.deleteMany({ _id: { $in: objectIds } });
                console.log('Admin bulk-action: Sponsor deletion result:', { deletedCount: deletedFromSponsors.deletedCount });
                
                console.log('Admin bulk-action: Attempting to delete from SponsorNew...');
                const deletedFromSponsorsNew = await SponsorNew.deleteMany({ _id: { $in: objectIds } });
                console.log('Admin bulk-action: SponsorNew deletion result:', { deletedCount: deletedFromSponsorsNew.deletedCount });
                
                const totalDeleted = deletedFromPotential.deletedCount + deletedFromSponsors.deletedCount + deletedFromSponsorsNew.deletedCount;
                
                console.log(`Admin bulk-action: REJECT SUMMARY - Deleted ${deletedFromPotential.deletedCount} from PotentialSponsor, ${deletedFromSponsors.deletedCount} from Sponsor, ${deletedFromSponsorsNew.deletedCount} from SponsorNew. Total: ${totalDeleted}`);
                
                result = { message: `Rejected ${totalDeleted} sponsors` };
                break;
            }
                
            case 'mark-complete':
                // Update analysis status to complete for selected sponsors
                const updatedPotential = await PotentialSponsor.updateMany(
                    { _id: { $in: objectIds } },
                    { $set: { analysisStatus: 'complete' } }
                );
                
                const updatedSponsors = await Sponsor.updateMany(
                    { _id: { $in: objectIds } },
                    { $set: { analysisStatus: 'complete' } }
                );
                
                const totalUpdated = updatedPotential.modifiedCount + updatedSponsors.modifiedCount;
                
                result = { message: `Marked ${totalUpdated} sponsors as complete` };
                break;
                
            case 'delete': {
                console.log('Admin bulk-action: Starting DELETE action for', objectIds.length, 'sponsor(s)');
                console.log('Admin bulk-action: ObjectIds to delete:', objectIds.map(id => id.toString()));
                
                // First, check what exists in each collection before deletion
                try {
                    const [foundInPotential, foundInSponsors, foundInSponsorsNew] = await Promise.all([
                        PotentialSponsor.find({ _id: { $in: objectIds } }).select('_id sponsorName newslettersSponsored'),
                        Sponsor.find({ _id: { $in: objectIds } }).select('_id sponsorName newsletterSponsored newslettersSponsored'),
                        SponsorNew.find({ _id: { $in: objectIds } }).select('_id sponsorName newslettersSponsored')
                    ]);
                    
                    console.log('Admin bulk-action: Found in PotentialSponsor:', foundInPotential.length, foundInPotential.map(s => ({ id: s._id.toString(), name: s.sponsorName })));
                    console.log('Admin bulk-action: Found in Sponsor:', foundInSponsors.length, foundInSponsors.map(s => ({ 
                        id: s._id.toString(), 
                        name: s.sponsorName,
                        hasNewslettersSponsored: !!s.newslettersSponsored,
                        newslettersCount: Array.isArray(s.newslettersSponsored) ? s.newslettersSponsored.length : 0
                    })));
                    console.log('Admin bulk-action: Found in SponsorNew:', foundInSponsorsNew.length, foundInSponsorsNew.map(s => ({ 
                        id: s._id.toString(), 
                        name: s.sponsorName,
                        hasNewslettersSponsored: !!s.newslettersSponsored,
                        newslettersCount: Array.isArray(s.newslettersSponsored) ? s.newslettersSponsored.length : 0
                    })));
                    
                    // Delete sponsors from all collections (PotentialSponsor, Sponsor, SponsorNew)
                    console.log('Admin bulk-action: Attempting to delete from PotentialSponsor...');
                    const deletedFromPotential = await PotentialSponsor.deleteMany({ _id: { $in: objectIds } });
                    console.log('Admin bulk-action: PotentialSponsor deletion result:', { deletedCount: deletedFromPotential.deletedCount });
                    
                    console.log('Admin bulk-action: Attempting to delete from Sponsor...');
                    const deletedFromSponsors = await Sponsor.deleteMany({ _id: { $in: objectIds } });
                    console.log('Admin bulk-action: Sponsor deletion result:', { deletedCount: deletedFromSponsors.deletedCount });
                    
                    console.log('Admin bulk-action: Attempting to delete from SponsorNew...');
                    const deletedFromSponsorsNew = await SponsorNew.deleteMany({ _id: { $in: objectIds } });
                    console.log('Admin bulk-action: SponsorNew deletion result:', { deletedCount: deletedFromSponsorsNew.deletedCount });
                    
                    const totalDeleted = deletedFromPotential.deletedCount + deletedFromSponsors.deletedCount + deletedFromSponsorsNew.deletedCount;
                    
                    console.log(`Admin bulk-action: DELETE SUMMARY - Deleted ${deletedFromPotential.deletedCount} from PotentialSponsor, ${deletedFromSponsors.deletedCount} from Sponsor, ${deletedFromSponsorsNew.deletedCount} from SponsorNew. Total: ${totalDeleted}`);
                    
                    if (totalDeleted === 0) {
                        console.warn('Admin bulk-action: WARNING - No sponsors were deleted from any collection!');
                        console.warn('Admin bulk-action: This might indicate the IDs were not found in any collection.');
                    }
                    
                    result = { message: `Deleted ${totalDeleted} sponsors` };
                } catch (deleteError) {
                    console.error('Admin bulk-action: Error during DELETE operation:', deleteError);
                    console.error('Admin bulk-action: DELETE error details:', {
                        message: deleteError.message,
                        stack: deleteError.stack,
                        objectIds: objectIds.map(id => id.toString())
                    });
                    throw deleteError; // Re-throw to be caught by outer catch
                }
                break;
            }
                
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        
        console.log('Admin bulk-action: Sending success response:', result);
        res.status(200).json(result);
    } catch (error) {
        console.error('Admin bulk-action: Error performing bulk action:', error);
        console.error('Admin bulk-action: Error details:', {
            message: error.message,
            stack: error.stack,
            action: req.body.action,
            sponsorIds: req.body.sponsorIds
        });
        res.status(500).json({ error: 'Error performing bulk action' });
    }
});

// Mark affiliate program as interested
router.post('/sponsors/:id/mark-interested', [auth, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        
        const sponsor = await Sponsor.findById(id);
        if (!sponsor) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }
        
        if (!sponsor.isAffiliateProgram) {
            return res.status(400).json({ error: 'This is not an affiliate program' });
        }
        
        // Add user to interested list if not already there
        if (!sponsor.interestedUsers.includes(userId)) {
            sponsor.interestedUsers.push(userId);
            await sponsor.save();
        }
        
        res.status(200).json({ message: 'Marked as interested' });
    } catch (error) {
        console.error('Error marking affiliate as interested:', error);
        res.status(500).json({ error: 'Error marking as interested' });
    }
});

// Get recent activity
router.get('/activity', [auth, admin], async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        // Get recent potential sponsors
        const recentPotentialSponsors = await PotentialSponsor.find()
            .sort({ dateAdded: -1 })
            .limit(parseInt(limit) / 2)
            .select('sponsorName newsletterSponsored dateAdded confidence');
        
        // Get recent approved sponsors
        const recentApprovedSponsors = await Sponsor.find()
            .sort({ dateAdded: -1 })
            .limit(parseInt(limit) / 2)
            .select('sponsorName newsletterSponsored dateAdded');
        
        // Get recent denied sponsors
        const recentDeniedSponsors = await DeniedSponsorLink.find()
            .sort({ dateDenied: -1 })
            .limit(parseInt(limit) / 2)
            .select('rootDomain reason dateDenied');
        
        // Combine and sort all activities
        const activities = [
            ...recentPotentialSponsors.map(sponsor => ({
                type: 'discovered',
                message: `New sponsor discovered: ${sponsor.sponsorName}`,
                details: `${sponsor.newsletterSponsored} (${sponsor.confidence}% confidence)`,
                timestamp: sponsor.dateAdded
            })),
            ...recentApprovedSponsors.map(sponsor => ({
                type: 'approved',
                message: `Sponsor approved: ${sponsor.sponsorName}`,
                details: sponsor.newsletterSponsored,
                timestamp: sponsor.dateAdded
            })),
            ...recentDeniedSponsors.map(denied => ({
                type: 'rejected',
                message: `Sponsor rejected: ${denied.rootDomain}`,
                details: denied.reason,
                timestamp: denied.dateDenied
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
         .slice(0, parseInt(limit));
        
        res.status(200).json(activities);
    } catch (error) {
        console.error('Error getting activity:', error);
        res.status(500).json({ error: 'Error getting activity' });
    }
});

// Run Python scraper
router.post('/scraper/run', [auth, admin], async (req, res) => {
    let responseSent = false;
    
    const sendResponse = (statusCode, data) => {
        if (!responseSent) {
            responseSent = true;
            res.status(statusCode).json(data);
        }
    };
    
    try {
        console.log("Starting Python Newsletter Scraper from admin dashboard...");
        
        // Check if we're in a Heroku environment
        const isHeroku = process.env.NODE_ENV === 'production' && process.env.DYNO;
        
        if (isHeroku) {
            // In Heroku, try to use Python directly
            const pythonCommands = ['python3', 'python'];
            let pythonProcess;
            let pythonCommand;
            
            for (const cmd of pythonCommands) {
                try {
                    // Path to the Python API wrapper
                    const pythonScriptPath = path.join(__dirname, '../newsletter_scraper/api_wrapper.py');
                    
                    pythonProcess = spawn(cmd, [pythonScriptPath], {
                        cwd: path.join(__dirname, '../newsletter_scraper'),
                        env: {
                            ...process.env,
                            PYTHONPATH: path.join(__dirname, '../newsletter_scraper'),
                            MAX_EMAILS_PER_RUN: '75'  // Process 75 emails per admin run
                        }
                    });
                    pythonCommand = cmd;
                    console.log(`Successfully started Python process with ${cmd}`);
                    break; // Success, exit the loop
                } catch (error) {
                    console.log(`Failed to spawn ${cmd}, trying next...`, error.message);
                    continue;
                }
            }
            
            if (!pythonProcess) {
                return sendResponse(500, {
                    success: false,
                    message: 'Failed to start Python process - no Python interpreter found',
                    error: 'No Python interpreter available in Heroku environment. Make sure Python buildpack is added.'
                });
            }
            
            let output = '';
            let errorOutput = '';
            
            // Capture stdout
            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            // Capture stderr
            pythonProcess.stderr.on('data', (data) => {
                const logData = data.toString();
                errorOutput += logData;
                console.log("Python stderr:", logData);
            });
            
            // Handle process completion
            pythonProcess.on('close', (code) => {
                console.log(`Python scraper process exited with code ${code}`);
                
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        console.log("Python scraper completed successfully:", result);
                        sendResponse(200, {
                            success: true,
                            message: 'Scraper completed successfully',
                            result: result
                        });
                    } catch (parseError) {
                        console.error("Error parsing Python output:", parseError);
                        sendResponse(200, {
                            success: true,
                            message: 'Scraper completed (output parsing failed)',
                            rawOutput: output,
                            errorOutput: errorOutput
                        });
                    }
                } else {
                    console.error("Python scraper failed with code:", code);
                    sendResponse(400, {
                        success: false,
                        message: 'Scraper failed',
                        exitCode: code,
                        errorOutput: errorOutput,
                        output: output
                    });
                }
            });
            
            // Handle process errors
            pythonProcess.on('error', (error) => {
                console.error("Failed to start Python scraper:", error);
                sendResponse(500, {
                    success: false,
                    message: 'Failed to start scraper',
                    error: error.message
                });
            });
            
            // Set timeout (10 minutes for admin)
            setTimeout(() => {
                if (!pythonProcess.killed) {
                    console.log("Python scraper timeout - killing process");
                    pythonProcess.kill();
                    sendResponse(408, {
                        success: false,
                        message: 'Scraper timeout',
                        timeout: true
                    });
                }
            }, 600000); // 10 minutes
            
        } else {
            // Local development - return a mock response
            console.log("Running in development mode - returning mock scraper response");
            sendResponse(200, {
                success: true,
                message: 'Scraper simulation completed (development mode)',
                result: {
                    sponsors_found: 0,
                    message: 'Python scraper not available in development mode'
                }
            });
        }
        
    } catch (error) {
        console.error("Error running Python scraper:", error);
        sendResponse(500, {
            success: false,
            message: 'Error running scraper',
            error: error.message
        });
    }
});

// List available Gemini models
router.get('/test/gemini/models', [auth, admin], async (req, res) => {
    const { spawn } = require('child_process');
    const path = require('path');
    let responseSent = false;
    
    const sendResponse = (statusCode, data) => {
        if (!responseSent) {
            responseSent = true;
            res.status(statusCode).json(data);
        }
    };
    
    try {
        console.log("Listing available Gemini models...");
        
        // Create a Python script to list models
        const listModelsScript = `
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import google.generativeai as genai
    from config import GEMINI_API_KEY
    
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found in environment")
        sys.exit(1)
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    # List all available models
    models = genai.list_models()
    
    print("SUCCESS: Available Gemini Models:")
    print("=" * 60)
    
    available_models = []
    for model in models:
        model_name = model.name
        # Extract just the model identifier (e.g., 'gemini-pro' from 'models/gemini-pro')
        if '/' in model_name:
            model_id = model_name.split('/')[-1]
        else:
            model_id = model_name
        
        # Check if model supports generateContent
        supports_generate = 'generateContent' in model.supported_generation_methods if hasattr(model, 'supported_generation_methods') else False
        
        model_info = {
            'name': model_id,
            'full_name': model_name,
            'supports_generateContent': supports_generate,
            'display_name': getattr(model, 'display_name', 'N/A'),
            'description': getattr(model, 'description', 'N/A')
        }
        available_models.append(model_info)
        
        status = "✅" if supports_generate else "❌"
        print(f"{status} {model_id} (Full: {model_name})")
        if supports_generate:
            print(f"   Display: {model_info['display_name']}")
            print(f"   Description: {model_info['description'][:100]}...")
        print()
    
    print("=" * 60)
    print(f"Total models found: {len(available_models)}")
    print(f"Models supporting generateContent: {sum(1 for m in available_models if m['supports_generateContent'])}")
    
    # Print recommended models
    print()
    print("RECOMMENDED MODELS (support generateContent):")
    for model in available_models:
        if model['supports_generateContent']:
            print(f"  • {model['name']}")
    
except ImportError as e:
    print(f"ERROR: Missing package - {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
`;
        
        // Write script to temp file
        const fs = require('fs');
        const scriptPath = path.join(__dirname, '../newsletter_scraper/list_gemini_models.py');
        fs.writeFileSync(scriptPath, listModelsScript);
        
        // Run the script
        const isHeroku = process.env.NODE_ENV === 'production' && process.env.DYNO;
        const pythonCommands = isHeroku ? ['python3', 'python'] : ['python3', 'python'];
        let pythonProcess;
        let pythonCommand;
        
        for (const cmd of pythonCommands) {
            try {
                pythonProcess = spawn(cmd, [scriptPath], {
                    cwd: path.join(__dirname, '../newsletter_scraper'),
                    env: {
                        ...process.env,
                        PYTHONPATH: path.join(__dirname, '../newsletter_scraper')
                    }
                });
                pythonCommand = cmd;
                break;
            } catch (error) {
                continue;
            }
        }
        
        if (!pythonProcess) {
            return res.status(500).json({
                success: false,
                message: 'Python not found. Tried: ' + pythonCommands.join(', ')
            });
        }
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync(scriptPath);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            if (code === 0) {
                sendResponse(200, {
                    success: true,
                    message: 'Successfully listed Gemini models',
                    output: output.trim(),
                    errorOutput: errorOutput.trim()
                });
            } else {
                sendResponse(500, {
                    success: false,
                    message: 'Failed to list Gemini models',
                    output: output.trim(),
                    errorOutput: errorOutput.trim(),
                    exitCode: code
                });
            }
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            if (!pythonProcess.killed) {
                pythonProcess.kill();
                sendResponse(408, {
                    success: false,
                    message: 'List models request timed out'
                });
            }
        }, 30000);
        
    } catch (error) {
        console.error("Error listing Gemini models:", error);
        sendResponse(500, {
            success: false,
            message: 'Error listing Gemini models',
            error: error.message
        });
    }
});

// Test Gemini API connection
router.get('/test/gemini', [auth, admin], async (req, res) => {
    const { spawn } = require('child_process');
    const path = require('path');
    let responseSent = false;
    
    const sendResponse = (statusCode, data) => {
        if (!responseSent) {
            responseSent = true;
            res.status(statusCode).json(data);
        }
    };
    
    try {
        console.log("Testing Gemini API connection...");
        
        // Create a simple Python test script
        const testScript = `
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import google.generativeai as genai
    from config import GEMINI_API_KEY
    
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found in environment")
        sys.exit(1)
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # Test with a simple prompt
    response = model.generate_content("Say 'Hello, Gemini is working!' if you can read this.")
    
    print(f"SUCCESS: {response.text}")
    print(f"Model: gemini-2.5-flash")
    print(f"API Key Length: {len(GEMINI_API_KEY)}")
    
except ImportError as e:
    print(f"ERROR: Missing package - {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
`;
        
        // Write test script to temp file
        const fs = require('fs');
        const testScriptPath = path.join(__dirname, '../newsletter_scraper/test_gemini.py');
        fs.writeFileSync(testScriptPath, testScript);
        
        // Run the test script - use same Python detection as scraper
        const isHeroku = process.env.NODE_ENV === 'production' && process.env.DYNO;
        const pythonCommands = isHeroku ? ['python3', 'python'] : ['python3', 'python'];
        let pythonProcess;
        let pythonCommand;
        
        for (const cmd of pythonCommands) {
            try {
                pythonProcess = spawn(cmd, [testScriptPath], {
                    cwd: path.join(__dirname, '../newsletter_scraper'),
                    env: {
                        ...process.env,
                        PYTHONPATH: path.join(__dirname, '../newsletter_scraper')
                    }
                });
                pythonCommand = cmd;
                break;
            } catch (error) {
                continue;
            }
        }
        
        if (!pythonProcess) {
            return res.status(500).json({
                success: false,
                message: 'Python not found. Tried: ' + pythonCommands.join(', ')
            });
        }
        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            // Clean up temp file
            try {
                fs.unlinkSync(testScriptPath);
            } catch (e) {
                // Ignore cleanup errors
            }
            
            if (code === 0) {
                sendResponse(200, {
                    success: true,
                    message: 'Gemini API test successful!',
                    output: output.trim(),
                    errorOutput: errorOutput.trim()
                });
            } else {
                sendResponse(500, {
                    success: false,
                    message: 'Gemini API test failed',
                    output: output.trim(),
                    errorOutput: errorOutput.trim(),
                    exitCode: code
                });
            }
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            if (!pythonProcess.killed) {
                pythonProcess.kill();
                sendResponse(408, {
                    success: false,
                    message: 'Gemini API test timed out'
                });
            }
        }, 30000);
        
    } catch (error) {
        console.error("Error testing Gemini API:", error);
        sendResponse(500, {
            success: false,
            message: 'Error testing Gemini API',
            error: error.message
        });
    }
});

// Export sponsors to CSV
router.get('/export/csv', [auth, admin], async (req, res) => {
    try {
        const { type = 'pending' } = req.query;
        
        let sponsors;
        let filename;
        
        if (type === 'approved') {
            sponsors = await Sponsor.find().select('sponsorName sponsorLink rootDomain tags newsletterSponsored subscriberCount businessContact dateAdded');
            filename = 'approved_sponsors.csv';
        } else {
            sponsors = await PotentialSponsor.find().select('sponsorName sponsorLink rootDomain tags newsletterSponsored subscriberCount businessContact confidence dateAdded');
            filename = 'pending_sponsors.csv';
        }
        
        // Convert to CSV
        const csvHeader = type === 'approved' 
            ? 'Sponsor Name,Sponsor Link,Root Domain,Tags,Newsletter,Subscribers,Business Contact,Date Added\n'
            : 'Sponsor Name,Sponsor Link,Root Domain,Tags,Newsletter,Subscribers,Business Contact,Confidence,Date Added\n';
        
        const csvRows = sponsors.map(sponsor => {
            const tags = sponsor.tags ? sponsor.tags.join(';') : '';
            const dateAdded = sponsor.dateAdded ? new Date(sponsor.dateAdded).toISOString().split('T')[0] : '';
            
            if (type === 'approved') {
                return `"${sponsor.sponsorName}","${sponsor.sponsorLink || ''}","${sponsor.rootDomain || ''}","${tags}","${sponsor.newsletterSponsored || ''}","${sponsor.subscriberCount || 0}","${sponsor.businessContact || ''}","${dateAdded}"`;
            } else {
                return `"${sponsor.sponsorName}","${sponsor.sponsorLink || ''}","${sponsor.rootDomain || ''}","${tags}","${sponsor.newsletterSponsored || ''}","${sponsor.subscriberCount || 0}","${sponsor.businessContact || ''}","${sponsor.confidence || 0}","${dateAdded}"`;
            }
        }).join('\n');
        
        const csvContent = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: 'Error exporting CSV' });
    }
});

// Migration route to split businessContact into sponsorEmail and sponsorApplication
router.post('/migrate-contacts', [auth, admin], async (req, res) => {
    try {
        console.log('Starting contact migration...');
        
        const migrationResults = {
            potentialSponsors: { processed: 0, errors: 0, details: [] },
            sponsors: { processed: 0, errors: 0, details: [] },
            totalProcessed: 0,
            totalErrors: 0
        };

        // Migrate PotentialSponsors
        const potentialSponsors = await PotentialSponsor.find({ 
            businessContact: { $exists: true, $ne: null, $ne: '' } 
        });
        
        console.log(`Found ${potentialSponsors.length} potential sponsors to migrate`);
        
        for (const sponsor of potentialSponsors) {
            try {
                const { businessContact } = sponsor;
                let sponsorEmail = null;
                let sponsorApplication = null;
                let contactMethod = 'none';

                if (businessContact && businessContact.trim()) {
                    if (businessContact.includes('@')) {
                        sponsorEmail = businessContact.trim();
                        contactMethod = 'email';
                    } else if (businessContact.startsWith('http')) {
                        sponsorApplication = businessContact.trim();
                        contactMethod = 'application';
                    } else {
                        // If it doesn't match either pattern, assume it's an email
                        sponsorEmail = businessContact.trim();
                        contactMethod = 'email';
                    }
                }

                await PotentialSponsor.findByIdAndUpdate(sponsor._id, {
                    $set: {
                        sponsorEmail,
                        sponsorApplication,
                        contactMethod
                    },
                    $unset: {
                        businessContact: 1
                    }
                });

                migrationResults.potentialSponsors.processed++;
                migrationResults.potentialSponsors.details.push({
                    id: sponsor._id,
                    sponsorName: sponsor.sponsorName,
                    originalContact: businessContact,
                    newEmail: sponsorEmail,
                    newApplication: sponsorApplication,
                    contactMethod
                });

            } catch (error) {
                console.error(`Error migrating potential sponsor ${sponsor._id}:`, error);
                migrationResults.potentialSponsors.errors++;
                migrationResults.potentialSponsors.details.push({
                    id: sponsor._id,
                    sponsorName: sponsor.sponsorName,
                    error: error.message
                });
            }
        }

        // Migrate Sponsors
        const sponsors = await Sponsor.find({ 
            businessContact: { $exists: true, $ne: null, $ne: '' } 
        });
        
        console.log(`Found ${sponsors.length} sponsors to migrate`);
        
        for (const sponsor of sponsors) {
            try {
                const { businessContact } = sponsor;
                let sponsorEmail = null;
                let sponsorApplication = null;
                let contactMethod = 'none';

                if (businessContact && businessContact.trim()) {
                    if (businessContact.includes('@')) {
                        sponsorEmail = businessContact.trim();
                        contactMethod = 'email';
                    } else if (businessContact.startsWith('http')) {
                        sponsorApplication = businessContact.trim();
                        contactMethod = 'application';
                    } else {
                        // If it doesn't match either pattern, assume it's an email
                        sponsorEmail = businessContact.trim();
                        contactMethod = 'email';
                    }
                }

                await Sponsor.findByIdAndUpdate(sponsor._id, {
                    $set: {
                        sponsorEmail,
                        sponsorApplication,
                        contactMethod
                    },
                    $unset: {
                        businessContact: 1
                    }
                });

                migrationResults.sponsors.processed++;
                migrationResults.sponsors.details.push({
                    id: sponsor._id,
                    sponsorName: sponsor.sponsorName,
                    originalContact: businessContact,
                    newEmail: sponsorEmail,
                    newApplication: sponsorApplication,
                    contactMethod
                });

            } catch (error) {
                console.error(`Error migrating sponsor ${sponsor._id}:`, error);
                migrationResults.sponsors.errors++;
                migrationResults.sponsors.details.push({
                    id: sponsor._id,
                    sponsorName: sponsor.sponsorName,
                    error: error.message
                });
            }
        }

        migrationResults.totalProcessed = migrationResults.potentialSponsors.processed + migrationResults.sponsors.processed;
        migrationResults.totalErrors = migrationResults.potentialSponsors.errors + migrationResults.sponsors.errors;

        console.log('Migration completed:', migrationResults);
        
        res.status(200).json({
            success: true,
            message: 'Contact migration completed successfully',
            results: migrationResults
        });

    } catch (error) {
        console.error('Migration failed:', error);
        res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
        });
    }
});

// Deny domain permanently
router.post('/deny-domain', [auth, admin], async (req, res) => {
    try {
        const { rootDomain, reason } = req.body;
        
        if (!rootDomain) {
            return res.status(400).json({ error: 'Root domain is required' });
        }
        
        // Check if domain is already denied
        const existingDeniedDomain = await DeniedDomain.findOne({ rootDomain: rootDomain.toLowerCase() });
        if (existingDeniedDomain) {
            return res.status(400).json({ 
                error: 'Domain is already in the denied list',
                deniedDomain: existingDeniedDomain
            });
        }
        
        // Add to denied domains list
        const deniedDomain = new DeniedDomain({
            rootDomain: rootDomain.toLowerCase(),
            reason: reason || 'Rejected by admin',
            dateAdded: new Date(),
            addedBy: 'admin'
        });
        
        await deniedDomain.save();
        
        res.status(200).json({ 
            success: true, 
            message: `Domain ${rootDomain} has been permanently blocked`,
            deniedDomain: deniedDomain
        });
    } catch (error) {
        console.error('Error denying domain:', error);
        res.status(500).json({ error: 'Error denying domain' });
    }
});

// Get denied domains
router.get('/denied-domains', [auth, admin], async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;
        
        const deniedDomains = await DeniedDomain.find()
            .sort({ dateAdded: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await DeniedDomain.countDocuments();
        
        res.status(200).json({
            deniedDomains,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting denied domains:', error);
        res.status(500).json({ error: 'Error getting denied domains' });
    }
});

// Remove domain from denied list
router.delete('/denied-domains/:domainId', [auth, admin], async (req, res) => {
    try {
        const { domainId } = req.params;
        
        const result = await DeniedDomain.findByIdAndDelete(domainId);
        
        if (!result) {
            return res.status(404).json({ error: 'Denied domain not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            message: `Domain ${result.rootDomain} has been unblocked` 
        });
    } catch (error) {
        console.error('Error removing denied domain:', error);
        res.status(500).json({ error: 'Error removing denied domain' });
    }
});

// Fix sponsor statuses based on contact information
router.post('/fix-sponsor-statuses', [auth, admin], async (req, res) => {
    try {
        console.log('🔧 Starting sponsor status fix...');
        
        // Helper function to check if sponsor has contact info
        const hasContactInfo = (sponsor) => {
            const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
            const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';
            const hasAffiliateLink = sponsor.affiliateSignupLink && sponsor.affiliateSignupLink.trim() !== '';
            const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';
            
            return hasEmail || hasApplication || hasAffiliateLink || hasBusinessContact;
        };

        // Helper function to determine correct status
        const determineStatus = (sponsor) => {
            const hasContact = hasContactInfo(sponsor);
            
            // Handle old analysisStatus field - convert to new status system
            let isApproved = false;
            if (sponsor.status === 'approved') {
                isApproved = true;
            } else if (sponsor.analysisStatus === 'complete') {
                isApproved = true;
            } else if (sponsor.analysisStatus === 'manual_review_required') {
                // Convert manual_review_required to pending
                isApproved = false;
            } else {
                // NEW LOGIC: Auto-approve sponsors with contact info
                isApproved = hasContact;
            }
            
            if (isApproved) {
                return { status: 'approved' };
            } else {
                return { status: 'pending' };
            }
        };

        const results = {
            potentialSponsors: { processed: 0, updated: 0, errors: 0 },
            sponsors: { processed: 0, updated: 0, errors: 0 },
            details: []
        };

        // Fix PotentialSponsor collection
        console.log('📋 Processing PotentialSponsor collection...');
        const potentialSponsors = await PotentialSponsor.find({});
        results.potentialSponsors.processed = potentialSponsors.length;
        
        for (const sponsor of potentialSponsors) {
            try {
                const newStatus = determineStatus(sponsor);
                
                // Only update if status needs to change
                if (sponsor.status !== newStatus.status) {
                    await PotentialSponsor.updateOne(
                        { _id: sponsor._id },
                        { 
                            $set: { 
                                status: newStatus.status
                            },
                            $unset: { analysisStatus: 1 } // Remove old analysisStatus field
                        }
                    );
                    results.potentialSponsors.updated++;
                    results.details.push(`Updated potential sponsor: ${sponsor.sponsorName} -> ${newStatus.status}`);
                }
            } catch (error) {
                results.potentialSponsors.errors++;
                results.details.push(`Error updating potential sponsor ${sponsor.sponsorName}: ${error.message}`);
            }
        }
        
        // Fix Sponsor collection
        console.log('📋 Processing Sponsor collection...');
        const sponsors = await Sponsor.find({});
        results.sponsors.processed = sponsors.length;
        
        for (const sponsor of sponsors) {
            try {
                const newStatus = determineStatus(sponsor);
                
                // Only update if status needs to change
                if (sponsor.status !== newStatus.status) {
                    await Sponsor.updateOne(
                        { _id: sponsor._id },
                        { 
                            $set: { 
                                status: newStatus.status
                            },
                            $unset: { analysisStatus: 1 } // Remove old analysisStatus field
                        }
                    );
                    results.sponsors.updated++;
                    results.details.push(`Updated sponsor: ${sponsor.sponsorName} -> ${newStatus.status}`);
                }
            } catch (error) {
                results.sponsors.errors++;
                results.details.push(`Error updating sponsor ${sponsor.sponsorName}: ${error.message}`);
            }
        }
        
        console.log('🎉 Status fix completed!');
        console.log(`📊 PotentialSponsor: ${results.potentialSponsors.updated} updated`);
        console.log(`📊 Sponsor: ${results.sponsors.updated} updated`);
        console.log(`📊 Total: ${results.potentialSponsors.updated + results.sponsors.updated} sponsors updated`);
        
        res.json({
            success: true,
            message: 'Sponsor statuses fixed successfully',
            results: {
                totalUpdated: results.potentialSponsors.updated + results.sponsors.updated,
                potentialSponsors: results.potentialSponsors,
                sponsors: results.sponsors,
                details: results.details.slice(0, 20) // Limit details to first 20 for response size
            }
        });
        
    } catch (error) {
        console.error('❌ Error fixing sponsor statuses:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error fixing sponsor statuses',
            message: error.message 
        });
    }
});

// Consolidate all sponsor data into consistent model
router.post('/consolidate-sponsors', [auth, admin], async (req, res) => {
    try {
        console.log('🔄 Starting comprehensive sponsor consolidation...');
        
        // Helper function to check if sponsor has contact info
        const hasContactInfo = (sponsor) => {
            const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
            const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';
            const hasAffiliateLink = sponsor.affiliateSignupLink && sponsor.affiliateSignupLink.trim() !== '';
            const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';
            
            return hasEmail || hasApplication || hasAffiliateLink || hasBusinessContact;
        };

        // Helper function to determine if sponsor is affiliate
        const isAffiliateSponsor = (sponsor) => {
            const hasAffiliateTag = sponsor.tags && (
                sponsor.tags.some(tag => tag.toLowerCase().includes('affiliate')) ||
                (typeof sponsor.tags === 'string' && sponsor.tags.toLowerCase().includes('affiliate'))
            );
            
            const hasAffiliateContact = sponsor.businessContact && 
                (sponsor.businessContact.includes('affiliate') || 
                 sponsor.businessContact.includes('partner') ||
                 sponsor.businessContact.includes('ref.') ||
                 sponsor.businessContact.includes('utm_'));
            
            return hasAffiliateTag || hasAffiliateContact;
        };

        // Helper function to determine correct status
        const determineStatus = (sponsor) => {
            const hasContact = hasContactInfo(sponsor);
            
            // Handle old analysisStatus field - convert to new status system
            let isApproved = false;
            if (sponsor.status === 'approved') {
                isApproved = true;
            } else if (sponsor.analysisStatus === 'complete') {
                isApproved = true;
            } else if (sponsor.analysisStatus === 'manual_review_required') {
                // Convert manual_review_required to pending
                isApproved = false;
            } else {
                // NEW LOGIC: Auto-approve sponsors with contact info
                isApproved = hasContact;
            }
            
            if (isApproved) {
                return { status: 'approved' };
            } else {
                return { status: 'pending' };
            }
        };

        // Helper function to extract affiliate info
        const extractAffiliateInfo = (sponsor) => {
            if (!sponsor.businessContact) return null;
            
            const businessContact = sponsor.businessContact.trim();
            if (businessContact === '') return null;
            
            return {
                isAffiliateProgram: true,
                affiliateSignupLink: businessContact,
                commissionInfo: 'Commission rates, terms, etc.'
            };
        };

        // Helper function to normalize tags
        const normalizeTags = (tags) => {
            if (!tags) return [];
            
            if (Array.isArray(tags)) {
                return tags.filter(tag => tag && tag.trim() !== '');
            }
            
            if (typeof tags === 'string') {
                return tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            }
            
            return [];
        };

        const results = {
            potentialSponsors: { processed: 0, consolidated: 0, errors: 0 },
            sponsors: { processed: 0, consolidated: 0, errors: 0 },
            details: []
        };

        // Process ONLY the main Sponsors collection (Test > Sponsors in MongoDB)
        console.log('📋 Processing Sponsors collection...');
        const sponsors = await Sponsor.find({});
        results.sponsors.processed = sponsors.length;
        results.potentialSponsors.processed = 0; // Not using this collection
        
        console.log(`Found ${sponsors.length} sponsors in the main collection`);
        console.log('First few sponsor names:', sponsors.slice(0, 5).map(s => s.sponsorName));
        console.log('Sample sponsor status:', sponsors.slice(0, 3).map(s => ({ name: s.sponsorName, status: s.status, analysisStatus: s.analysisStatus })));
        
        console.log(`Starting to process ${sponsors.length} sponsors...`);
        
        for (let i = 0; i < sponsors.length; i++) {
            const sponsor = sponsors[i];
            try {
                console.log(`Processing ${i + 1}/${sponsors.length}: ${sponsor.sponsorName}`);
                
                const isAffiliate = isAffiliateSponsor(sponsor);
                const affiliateInfo = isAffiliate ? extractAffiliateInfo(sponsor) : null;
                const newStatus = determineStatus(sponsor);
                const normalizedTags = normalizeTags(sponsor.tags);
                
                const consolidatedData = {
                    // Basic info
                    sponsorName: sponsor.sponsorName || '',
                    sponsorLink: sponsor.sponsorLink || '',
                    rootDomain: sponsor.rootDomain || '',
                    newsletterSponsored: sponsor.newsletterSponsored || '',
                    subscriberCount: sponsor.subscriberCount || 0,
                    dateAdded: sponsor.dateAdded || new Date().toISOString(),
                    
                    // Contact info
                    sponsorEmail: sponsor.sponsorEmail || '',
                    sponsorApplication: sponsor.sponsorApplication || '',
                    contactMethod: sponsor.contactMethod || 'none',
                    businessContact: sponsor.businessContact || '',
                    
                    // Affiliate info - ensure boolean values
                    isAffiliateProgram: Boolean(isAffiliate),
                    affiliateSignupLink: affiliateInfo?.affiliateSignupLink || '',
                    commissionInfo: affiliateInfo?.commissionInfo || '',
                    
                    // Status and classification
                    status: newStatus.status,
                    confidence: sponsor.confidence || 0,
                    tags: normalizedTags,
                    
                    // User interaction data (preserve existing)
                    userViewDates: sponsor.userViewDates || [],
                    viewedBy: sponsor.viewedBy || [],
                    appliedBy: sponsor.appliedBy || [],
                    userApplyDates: sponsor.userApplyDates || [],
                    
                    // Metadata
                    consolidatedAt: new Date()
                };
                
                await Sponsor.updateOne(
                    { _id: sponsor._id },
                    { 
                        $set: consolidatedData,
                        $unset: { analysisStatus: 1 } // Remove old analysisStatus field
                    }
                );
                
                results.sponsors.consolidated++;
                results.details.push(`Consolidated sponsor: ${sponsor.sponsorName} -> ${consolidatedData.status} (Affiliate: ${consolidatedData.isAffiliateProgram})`);
                
                // Log every 50 sponsors
                if ((i + 1) % 50 === 0) {
                    console.log(`Processed ${i + 1}/${sponsors.length} sponsors so far...`);
                }
            } catch (error) {
                results.sponsors.errors++;
                results.details.push(`Error consolidating sponsor ${sponsor.sponsorName}: ${error.message}`);
                console.error(`Error processing ${sponsor.sponsorName}:`, error);
            }
        }
        
        console.log('🎉 Consolidation completed!');
        console.log(`📊 PotentialSponsor: ${results.potentialSponsors.consolidated} consolidated`);
        console.log(`📊 Sponsor: ${results.sponsors.consolidated} consolidated`);
        console.log(`📊 Total: ${results.potentialSponsors.consolidated + results.sponsors.consolidated} sponsors consolidated`);
        
        res.json({
            success: true,
            message: 'Sponsor data consolidated successfully',
            results: {
                totalConsolidated: results.potentialSponsors.consolidated + results.sponsors.consolidated,
                potentialSponsors: results.potentialSponsors,
                sponsors: results.sponsors,
                details: results.details.slice(0, 30) // Limit details for response size
            }
        });
        
    } catch (error) {
        console.error('❌ Error consolidating sponsors:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error consolidating sponsor data',
            message: error.message 
        });
    }
});

// Simple test endpoint to check sponsor count
router.get('/test-sponsor-count', [auth, admin], async (req, res) => {
    try {
        const totalCount = await Sponsor.countDocuments({});
        const sampleSponsors = await Sponsor.find({}).limit(5).select('sponsorName status analysisStatus');
        
        // Check status distribution
        const statusCounts = await Sponsor.aggregate([
            {
                $group: {
                    _id: { status: '$status', analysisStatus: '$analysisStatus' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Check how many have contact info
        const withContactInfo = await Sponsor.countDocuments({
            $or: [
                { sponsorEmail: { $exists: true, $ne: '', $ne: null } },
                { sponsorApplication: { $exists: true, $ne: '', $ne: null } },
                { affiliateSignupLink: { $exists: true, $ne: '', $ne: null } },
                { businessContact: { $exists: true, $ne: '', $ne: null } }
            ]
        });
        
        res.json({
            success: true,
            totalCount: totalCount,
            sampleSponsors: sampleSponsors,
            statusDistribution: statusCounts,
            withContactInfo: withContactInfo,
            withoutContactInfo: totalCount - withContactInfo
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export all sponsor data for debugging
router.get('/export-sponsor-data', [auth, admin], async (req, res) => {
    try {
        console.log('📊 Exporting all sponsor data...');
        
        // Get all sponsors from both collections
        const sponsors = await Sponsor.find({});
        const potentialSponsors = await PotentialSponsor.find({});
        
        console.log(`Found ${sponsors.length} sponsors in Sponsor collection`);
        console.log(`Found ${potentialSponsors.length} sponsors in PotentialSponsor collection`);
        console.log(`Total: ${sponsors.length + potentialSponsors.length} sponsors`);
        
        // Create export data
        const exportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalSponsors: sponsors.length + potentialSponsors.length,
                approvedSponsors: sponsors.length,
                potentialSponsors: potentialSponsors.length
            },
            sponsors: sponsors.map(sponsor => ({
                collection: 'Sponsor',
                _id: sponsor._id,
                sponsorName: sponsor.sponsorName,
                status: sponsor.status,
                analysisStatus: sponsor.analysisStatus,
                sponsorEmail: sponsor.sponsorEmail,
                sponsorApplication: sponsor.sponsorApplication,
                businessContact: sponsor.businessContact,
                affiliateSignupLink: sponsor.affiliateSignupLink,
                isAffiliateProgram: sponsor.isAffiliateProgram,
                contactMethod: sponsor.contactMethod,
                tags: sponsor.tags,
                newsletterSponsored: sponsor.newsletterSponsored,
                subscriberCount: sponsor.subscriberCount,
                dateAdded: sponsor.dateAdded,
                confidence: sponsor.confidence
            })),
            potentialSponsors: potentialSponsors.map(sponsor => ({
                collection: 'PotentialSponsor',
                _id: sponsor._id,
                sponsorName: sponsor.sponsorName,
                status: sponsor.status,
                analysisStatus: sponsor.analysisStatus,
                sponsorEmail: sponsor.sponsorEmail,
                sponsorApplication: sponsor.sponsorApplication,
                businessContact: sponsor.businessContact,
                affiliateSignupLink: sponsor.affiliateSignupLink,
                isAffiliateProgram: sponsor.isAffiliateProgram,
                contactMethod: sponsor.contactMethod,
                tags: sponsor.tags,
                newsletterSponsored: sponsor.newsletterSponsored,
                subscriberCount: sponsor.subscriberCount,
                dateAdded: sponsor.dateAdded,
                confidence: sponsor.confidence
            }))
        };
        
        // Analyze status distribution
        const statusCounts = {};
        [...sponsors, ...potentialSponsors].forEach(sponsor => {
            const status = sponsor.status || 'missing_status';
            const analysisStatus = sponsor.analysisStatus || 'missing_analysis';
            const key = `${status}/${analysisStatus}`;
            statusCounts[key] = (statusCounts[key] || 0) + 1;
        });
        
        // Analyze contact info
        let withContactInfo = 0;
        let withoutContactInfo = 0;
        
        [...sponsors, ...potentialSponsors].forEach(sponsor => {
            const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
            const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';
            const hasAffiliateLink = sponsor.affiliateSignupLink && sponsor.affiliateSignupLink.trim() !== '';
            const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';
            
            if (hasEmail || hasApplication || hasAffiliateLink || hasBusinessContact) {
                withContactInfo++;
            } else {
                withoutContactInfo++;
            }
        });
        
        // Analyze affiliate programs
        let affiliatePrograms = 0;
        [...sponsors, ...potentialSponsors].forEach(sponsor => {
            if (sponsor.isAffiliateProgram) {
                affiliatePrograms++;
            }
        });
        
        const analysis = {
            statusDistribution: statusCounts,
            contactInfo: {
                withContactInfo,
                withoutContactInfo
            },
            affiliatePrograms
        };
        
        res.json({
            success: true,
            data: exportData,
            analysis: analysis
        });
        
    } catch (error) {
        console.error('❌ Error exporting sponsor data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error exporting sponsor data',
            message: error.message 
        });
    }
});

// ============================================
// NEWSLETTER MANAGEMENT ROUTES
// ============================================

// Generate a new newsletter edition
router.post('/newsletter/generate', [auth, admin], async (req, res) => {
    try {
        console.log('📧 Generating new newsletter edition...');
        
        // Fetch 3-4 sponsors from SponsorNew where status = 'approved'
        let sponsors = await SponsorNew.find({
            status: 'approved'
        })
        .sort({ _id: -1 })
        .limit(4);

        if (sponsors.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Not enough approved sponsors available. Need at least 3 sponsors.',
                available: sponsors.length
            });
        }

        // Create subject line with current date
        const currentDate = new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const subject = `This week's new sponsors - ${currentDate}`;

        // Single CTA option
        const ctaIndex = 0; // Keep for backward compatibility, but always use same CTA

        // Create newsletter edition
        const newsletter = new Newsletter({
            subject: subject,
            sponsors: sponsors.map(s => s._id),
            status: 'draft',
            ctaIndex: ctaIndex,
            createdAt: new Date()
        });

        await newsletter.save();

        // Populate sponsors for response with all necessary fields including newslettersSponsored
        await newsletter.populate({
            path: 'sponsors',
            select: 'sponsorName sponsorLink rootDomain tags sponsorEmail contactPersonName contactPersonTitle contactType newslettersSponsored avgAudienceSize totalPlacements'
        });

        console.log(`✅ Newsletter edition created: ${newsletter._id}`);

        res.status(201).json({
            success: true,
            newsletter: newsletter
        });

    } catch (error) {
        console.error('❌ Error generating newsletter:', error);
        res.status(500).json({
            success: false,
            error: 'Error generating newsletter',
            message: error.message
        });
    }
});

// Update newsletter (subject, customIntro, sponsors, scheduledFor, status)
router.put('/newsletter/update/:id', [auth, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, customIntro, sponsors, scheduledFor, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid newsletter ID'
            });
        }

        const newsletter = await Newsletter.findById(id);

        if (!newsletter) {
            return res.status(404).json({
                success: false,
                error: 'Newsletter not found'
            });
        }

        if (newsletter.status === 'sent') {
            return res.status(400).json({
                success: false,
                error: 'Cannot update a newsletter that has already been sent'
            });
        }

        // Update fields if provided
        if (subject !== undefined) {
            newsletter.subject = subject;
        }

        if (customIntro !== undefined) {
            newsletter.customIntro = customIntro;
        }

        if (scheduledFor !== undefined) {
            newsletter.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
        }

        if (status !== undefined && ['draft', 'scheduled', 'sent'].includes(status)) {
            newsletter.status = status;
        }

        if (sponsors && Array.isArray(sponsors)) {
            // Validate that all sponsor IDs are valid
            const validSponsorIds = sponsors.filter(id => mongoose.Types.ObjectId.isValid(id));
            if (validSponsorIds.length < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'At least 1 valid sponsor ID is required'
                });
            }
            newsletter.sponsors = validSponsorIds;
        }

        await newsletter.save();
        await newsletter.populate({
            path: 'sponsors',
            select: 'sponsorName sponsorLink rootDomain tags sponsorEmail contactPersonName contactPersonTitle contactType newslettersSponsored avgAudienceSize totalPlacements'
        });

        console.log(`✅ Newsletter updated: ${newsletter._id}`);

        res.json({
            success: true,
            newsletter: newsletter
        });

    } catch (error) {
        console.error('❌ Error updating newsletter:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating newsletter',
            message: error.message
        });
    }
});

// Send newsletter to all subscribers
router.post('/newsletter/send/:id', [auth, admin], async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid newsletter ID'
            });
        }

        const newsletter = await Newsletter.findById(id).populate({
            path: 'sponsors',
            select: 'sponsorName sponsorLink rootDomain tags sponsorEmail contactPersonName contactPersonTitle contactType newslettersSponsored avgAudienceSize totalPlacements'
        });

        if (!newsletter) {
            return res.status(404).json({
                success: false,
                error: 'Newsletter not found'
            });
        }

        if (newsletter.status === 'sent') {
            return res.status(400).json({
                success: false,
                error: 'Newsletter has already been sent'
            });
        }

        if (newsletter.sponsors.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Newsletter must have at least 3 sponsors before sending'
            });
        }

        // Fetch all newsletter subscribers
        // Check both: Users with newsletterOptIn = true AND NewsletterSubscriber collection
        const { NewsletterSubscriber } = require('../models/newsletterSubscriber');
        
        // Get users who opted in
        const subscribedUsers = await User.find({
            newsletterOptIn: true
        }).select('email name');

        // Get non-user subscribers
        const newsletterSubscribers = await NewsletterSubscriber.find({
            isActive: true
        }).select('email');

        // Combine and deduplicate by email
        const subscriberMap = new Map();
        
        subscribedUsers.forEach(user => {
            subscriberMap.set(user.email.toLowerCase(), {
                email: user.email,
                name: user.name
            });
        });

        newsletterSubscribers.forEach(subscriber => {
            if (!subscriberMap.has(subscriber.email.toLowerCase())) {
                subscriberMap.set(subscriber.email.toLowerCase(), {
                    email: subscriber.email,
                    name: null // Non-users don't have names
                });
            }
        });

        const subscribers = Array.from(subscriberMap.values());

        if (subscribers.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No subscribers found to send newsletter to'
            });
        }

        console.log(`📧 Sending newsletter to ${subscribers.length} subscribers...`);

        // Prepare dashboard and unsubscribe links
        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://sponsor-db.com';
        const dashboardLink = `${frontendUrl}/sponsors`;
        const signupLink = `${frontendUrl}/signup`;
        const pricingLink = `${frontendUrl}/pricing`;
        
        // CTA options array (must match the one in generate endpoint)
        // Single CTA option
        const ctaText = "Want access to our full database? Try SponsorDB Free for 14 Days →";
        const ctaLink = signupLink;
        
        // Send email to each subscriber
        let sentCount = 0;
        let failedCount = 0;

        // Import email template function
        const { renderWeeklySponsorsTemplate } = require('../utils/emailTemplate');

        for (const subscriber of subscribers) {
            try {
                // Get subscriber's first name
                const firstName = subscriber.name ? subscriber.name.split(' ')[0] : 'there';
                
                // Generate unsubscribe link (you may want to create a proper unsubscribe endpoint)
                const unsubscribeLink = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

                // Render HTML email template
                const htmlContent = renderWeeklySponsorsTemplate({
                    firstName: firstName,
                    subject: newsletter.subject,
                    sponsors: newsletter.sponsors,
                    dashboardLink: dashboardLink,
                    unsubscribeLink: unsubscribeLink,
                    customIntro: newsletter.customIntro,
                    ctaText: ctaText,
                    ctaLink: ctaLink
                });

                // Generate plain text fallback using the template function
                const { generatePlainTextFallback } = require('../utils/emailTemplate');
                const textContent = generatePlainTextFallback({
                    firstName: firstName,
                    subject: newsletter.subject,
                    sponsors: newsletter.sponsors,
                    dashboardLink: dashboardLink,
                    unsubscribeLink: unsubscribeLink,
                    customIntro: newsletter.customIntro
                }) + `\n\n${ctaText}\n${ctaLink}\n\nThe SponsorDB Team`;

                await sendEmail(
                    subscriber.email,
                    newsletter.subject,
                    textContent,
                    htmlContent
                );
                sentCount++;
            } catch (emailError) {
                console.error(`Failed to send email to ${subscriber.email}:`, emailError);
                failedCount++;
            }
        }

        // Update newsletter status
        newsletter.status = 'sent';
        newsletter.sentAt = new Date();
        newsletter.recipientCount = sentCount;
        await newsletter.save();

        console.log(`✅ Newsletter sent: ${sentCount} successful, ${failedCount} failed`);

        res.json({
            success: true,
            message: 'Newsletter sent successfully',
            sentCount: sentCount,
            failedCount: failedCount,
            totalRecipients: subscribers.length
        });

    } catch (error) {
        console.error('❌ Error sending newsletter:', error);
        res.status(500).json({
            success: false,
            error: 'Error sending newsletter',
            message: error.message
        });
    }
});

// Send test email
router.post('/newsletter/send-test/:id', [auth, admin], async (req, res) => {
    try {
        const { id } = req.params;
        // Use logged-in user's email, or default to jacobbowlware@gmail.com
        const testEmail = req.body.testEmail || req.user.email || 'jacobbowlware@gmail.com';

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid newsletter ID'
            });
        }

        const newsletter = await Newsletter.findById(id).populate({
            path: 'sponsors',
            select: 'sponsorName sponsorLink rootDomain tags sponsorEmail contactPersonName contactPersonTitle contactType newslettersSponsored avgAudienceSize totalPlacements'
        });

        if (!newsletter) {
            return res.status(404).json({
                success: false,
                error: 'Newsletter not found'
            });
        }

        const { renderWeeklySponsorsTemplate } = require('../utils/emailTemplate');
        const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://sponsor-db.com';
        const dashboardLink = `${frontendUrl}/sponsors`;
        const signupLink = `${frontendUrl}/signup`;
        const pricingLink = `${frontendUrl}/pricing`;
        const unsubscribeLink = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(testEmail)}`;

        // Single CTA option (matches the send endpoint)
        const ctaText = "Want access to our full database? Try SponsorDB Free for 14 Days →";
        const ctaLink = signupLink;

        // Render HTML email template
        const htmlContent = renderWeeklySponsorsTemplate({
            firstName: 'Test',
            subject: newsletter.subject,
            sponsors: newsletter.sponsors,
            dashboardLink: dashboardLink,
            unsubscribeLink: unsubscribeLink,
            customIntro: newsletter.customIntro,
            ctaText: ctaText,
            ctaLink: ctaLink
        });

        // Generate plain text fallback using the template function
        const { generatePlainTextFallback } = require('../utils/emailTemplate');
        const textContent = generatePlainTextFallback({
            firstName: 'Test',
            subject: newsletter.subject,
            sponsors: newsletter.sponsors,
            dashboardLink: dashboardLink,
            unsubscribeLink: unsubscribeLink,
            customIntro: newsletter.customIntro
        }) + `\n\n${ctaText}\n${ctaLink}\n\nThe SponsorDB Team`;

        await sendEmail(
            testEmail,
            `[TEST] ${newsletter.subject}`,
            textContent,
            htmlContent
        );

        console.log(`✅ Test email sent to ${testEmail} for newsletter ${newsletter._id}`);

        res.json({
            success: true,
            message: `Test email sent to ${testEmail}`,
            testEmail: testEmail
        });

    } catch (error) {
        console.error('❌ Error sending test email:', error);
        res.status(500).json({
            success: false,
            error: 'Error sending test email',
            message: error.message
        });
    }
});

// List all newsletters (MUST come before /newsletter/:id route)
router.get('/newsletter/list', [auth, admin], async (req, res) => {
    try {
        const newsletters = await Newsletter.find({})
            .populate('sponsors', 'sponsorName sponsorLink rootDomain tags sponsorEmail contactPersonName contactPersonTitle contactType newslettersSponsored avgAudienceSize totalPlacements')
            .sort({ createdAt: -1 })
            .select('subject status createdAt sentAt recipientCount sponsors customIntro scheduledFor ctaIndex');

        res.json({
            success: true,
            newsletters: newsletters,
            count: newsletters.length
        });

    } catch (error) {
        console.error('❌ Error listing newsletters:', error);
        res.status(500).json({
            success: false,
            error: 'Error listing newsletters',
            message: error.message
        });
    }
});

// Get single newsletter by ID (MUST come after /newsletter/list route)
router.get('/newsletter/:id', [auth, admin], async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid newsletter ID'
            });
        }

        const newsletter = await Newsletter.findById(id)
            .populate({
                path: 'sponsors',
                select: 'sponsorName sponsorLink rootDomain tags sponsorEmail contactPersonName contactPersonTitle contactType newslettersSponsored avgAudienceSize totalPlacements'
            });

        if (!newsletter) {
            return res.status(404).json({
                success: false,
                error: 'Newsletter not found'
            });
        }

        res.json({
            success: true,
            newsletter: newsletter
        });

    } catch (error) {
        console.error('❌ Error getting newsletter:', error);
        res.status(500).json({
            success: false,
            error: 'Error getting newsletter',
            message: error.message
        });
    }
});

module.exports = router;
