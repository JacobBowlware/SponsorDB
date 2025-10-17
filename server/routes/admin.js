const express = require('express');
const router = express.Router();
const { PotentialSponsor } = require('../models/potentialSponsor');
const { Sponsor } = require('../models/sponsor');
const { DeniedSponsorLink } = require('../models/deniedSponsorLink');
const { DeniedDomain } = require('../models/deniedDomain');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { spawn } = require('child_process');
const path = require('path');

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

// Get admin dashboard stats
router.get('/stats', [auth, admin], async (req, res) => {
    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Get total sponsors (approved)
        const totalSponsors = await Sponsor.countDocuments();
        
        // Get sponsors with contact info (for public display)
        const sponsorsWithContactInfo = await Sponsor.countDocuments({
            $or: [
                { sponsorEmail: { $exists: true, $ne: '' } },
                { sponsorApplication: { $exists: true, $ne: '' } },
                { businessContact: { $exists: true, $ne: '' } }
            ]
        });
        
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
        const approvedSponsors = await Sponsor.countDocuments();
        const rejectedSponsors = await DeniedSponsorLink.countDocuments();
        const reviewedSponsors = await Sponsor.countDocuments({
            viewedBy: { $exists: true, $ne: [] }
        });
        
        // Get total views and applications
        const sponsorsWithViews = await Sponsor.find({ viewedBy: { $exists: true, $ne: [] } });
        const totalViews = sponsorsWithViews.reduce((sum, sponsor) => sum + sponsor.viewedBy.length, 0);
        
        const sponsorsWithApplications = await Sponsor.find({ appliedBy: { $exists: true, $ne: [] } });
        const totalApplications = sponsorsWithApplications.reduce((sum, sponsor) => sum + sponsor.appliedBy.length, 0);

        // Get weekly data for the last 8 weeks
        const weeklyData = [];
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i * 7 + 6) * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - (i * 7) * 24 * 60 * 60 * 1000);
            
            const weekCount = await Sponsor.countDocuments({
                dateAdded: {
                    $gte: weekStart,
                    $lte: weekEnd
                }
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
        
        // Build query for potential sponsors
        let potentialQuery = {};
        let sponsorQuery = {};
        
        // Apply search filter
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            potentialQuery.$or = [
                { sponsorName: searchRegex },
                { newsletterSponsored: searchRegex },
                { rootDomain: searchRegex }
            ];
            sponsorQuery.$or = [
                { sponsorName: searchRegex },
                { newsletterSponsored: searchRegex },
                { rootDomain: searchRegex }
            ];
        }
        
        // Apply confidence filter
        if (filter !== 'all') {
            switch (filter) {
                case 'high':
                    potentialQuery.confidence = { $gte: 85 };
                    break;
                case 'medium':
                    potentialQuery.confidence = { $gte: 70, $lt: 85 };
                    break;
                case 'low':
                    potentialQuery.confidence = { $lt: 70 };
                    break;
                case 'has-contact':
                    potentialQuery.businessContact = { $exists: true, $ne: '' };
                    sponsorQuery.businessContact = { $exists: true, $ne: '' };
                    break;
            }
        }
        
        // Apply status filter
        if (status !== 'all') {
            switch (status) {
                case 'pending':
                    // Sponsors without contact info
                    potentialQuery.analysisStatus = 'pending';
                    sponsorQuery.analysisStatus = 'pending';
                    break;
                case 'complete':
                    // Sponsors with contact info
                    potentialQuery.analysisStatus = 'complete';
                    sponsorQuery.analysisStatus = 'complete';
                    break;
                case 'manual_review_required':
                    // Sponsors requiring manual review
                    potentialQuery.analysisStatus = 'manual_review_required';
                    sponsorQuery.analysisStatus = 'manual_review_required';
                    break;
            }
        }
        
        // Apply affiliate program filter
        if (affiliateOnly === 'true') {
            // Only show affiliate programs
            potentialQuery.isAffiliateProgram = true;
            sponsorQuery.isAffiliateProgram = true;
        }
        // Note: No else clause - by default, show ALL sponsors (both affiliate and non-affiliate)
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        let sponsors = [];
        let total = 0;
        
        if (status === 'all' || status === 'pending' || status === 'complete' || status === 'manual_review_required') {
            // Get potential sponsors
            const potentialSponsors = await PotentialSponsor.find(potentialQuery)
                .sort(sort);
            
            const potentialWithStatus = potentialSponsors.map(sponsor => ({
                ...sponsor.toObject(),
                status: 'pending',  // Potential sponsors are always pending
                analysisStatus: sponsor.analysisStatus || 'pending'
            }));
            
            sponsors = [...sponsors, ...potentialWithStatus];
            total += await PotentialSponsor.countDocuments(potentialQuery);
        }
        
        if (status === 'all' || status === 'complete' || status === 'pending' || status === 'manual_review_required') {
            // Get approved sponsors
            const approvedSponsors = await Sponsor.find(sponsorQuery)
                .sort(sort);
            
            const approvedWithStatus = approvedSponsors.map(sponsor => ({
                ...sponsor.toObject(),
                status: sponsor.status || 'approved',  // Use the actual status field, default to 'approved'
                analysisStatus: sponsor.analysisStatus || 'complete'
            }));
            
            sponsors = [...sponsors, ...approvedWithStatus];
            total += await Sponsor.countDocuments(sponsorQuery);
        }
        
        // Sort combined results properly
        sponsors.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            // Handle different data types
            if (sortBy === 'dateAdded') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (sortBy === 'subscriberCount') {
                aVal = aVal || 0;
                bVal = bVal || 0;
            } else if (typeof aVal === 'string' && typeof bVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        
        // Apply pagination after sorting
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        sponsors = sponsors.slice(startIndex, endIndex);
        
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
        console.error('Error getting all sponsors:', error);
        res.status(500).json({ error: 'Error getting all sponsors' });
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
                
            case 'reject':
                // Add domains to denied list and delete from potential
                const sponsorsToReject = await PotentialSponsor.find({ _id: { $in: objectIds } });
                
                // Add to denied domains list
                const deniedDomains = sponsorsToReject
                    .filter(sponsor => sponsor.rootDomain)
                    .map(sponsor => ({
                        rootDomain: sponsor.rootDomain.toLowerCase(),
                        reason: 'Bulk rejected by admin',
                        dateAdded: new Date(),
                        addedBy: 'admin'
                    }));
                
                if (deniedDomains.length > 0) {
                    // Use upsert to avoid duplicates
                    for (const domain of deniedDomains) {
                        await DeniedDomain.findOneAndUpdate(
                            { rootDomain: domain.rootDomain },
                            domain,
                            { upsert: true, new: true }
                        );
                    }
                }
                
                // Delete from potential sponsors
                await PotentialSponsor.deleteMany({ _id: { $in: objectIds } });
                
                result = { message: `Rejected ${objectIds.length} sponsors` };
                break;
                
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
                
            case 'delete':
                // Delete sponsors from both collections
                const deletedFromPotential = await PotentialSponsor.deleteMany({ _id: { $in: objectIds } });
                const deletedFromSponsors = await Sponsor.deleteMany({ _id: { $in: objectIds } });
                
                const totalDeleted = deletedFromPotential.deletedCount + deletedFromSponsors.deletedCount;
                
                result = { message: `Deleted ${totalDeleted} sponsors` };
                break;
                
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
                            MAX_EMAILS_PER_RUN: '20'  // Override for admin runs
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

module.exports = router;
