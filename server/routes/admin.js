const express = require('express');
const router = express.Router();
const { PotentialSponsor } = require('../models/potentialSponsor');
const { Sponsor } = require('../models/sponsor');
const { DeniedSponsorLink } = require('../models/deniedSponsorLink');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { spawn } = require('child_process');
const path = require('path');
require('../middleware/corHeaders')(router);

// Get admin dashboard stats
router.get('/stats', [auth, admin], async (req, res) => {
    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Get total sponsors (approved)
        const totalSponsors = await Sponsor.countDocuments();
        
        // Get sponsors scraped this week
        const scrapedThisWeek = await PotentialSponsor.countDocuments({
            dateAdded: { $gte: oneWeekAgo }
        });
        
        // Get pending review count
        const pendingReview = await PotentialSponsor.countDocuments({
            analysisStatus: { $in: ['manual_review_required', 'pending'] }
        });
        
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

        const stats = {
            totalSponsors,
            scrapedThisWeek,
            pendingReview,
            successRate,
            approvedSponsors,
            rejectedSponsors,
            reviewedSponsors,
            totalViews,
            totalApplications
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
        const { page = 1, limit = 50, sortBy = 'dateAdded', sortOrder = 'desc', search = '', filter = 'all', status = 'all' } = req.query;
        
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
                    // Only get potential sponsors
                    break;
                case 'approved':
                    // Only get approved sponsors
                    break;
                case 'rejected':
                    // Get denied sponsors
                    break;
                case 'reviewed':
                    // Get sponsors that have been viewed
                    break;
            }
        }
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        let sponsors = [];
        let total = 0;
        
        if (status === 'all' || status === 'pending') {
            // Get potential sponsors
            const potentialSponsors = await PotentialSponsor.find(potentialQuery)
                .sort(sort);
            
            const potentialWithStatus = potentialSponsors.map(sponsor => ({
                ...sponsor.toObject(),
                status: 'pending',
                analysisStatus: sponsor.analysisStatus || 'pending'
            }));
            
            sponsors = [...sponsors, ...potentialWithStatus];
            total += await PotentialSponsor.countDocuments(potentialQuery);
        }
        
        if (status === 'all' || status === 'approved') {
            // Get approved sponsors
            const approvedSponsors = await Sponsor.find(sponsorQuery)
                .sort(sort);
            
            const approvedWithStatus = approvedSponsors.map(sponsor => ({
                ...sponsor.toObject(),
                status: 'approved',
                analysisStatus: 'complete'
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
        
        if (!action || !sponsorIds || !Array.isArray(sponsorIds)) {
            return res.status(400).json({ error: 'Invalid request data' });
        }
        
        let result;
        
        switch (action) {
            case 'approve':
                // Move sponsors from potential to approved
                const sponsorsToApprove = await PotentialSponsor.find({ _id: { $in: sponsorIds } });
                
                // Create approved sponsors
                const approvedSponsors = sponsorsToApprove.map(sponsor => ({
                    sponsorName: sponsor.sponsorName,
                    sponsorLink: sponsor.sponsorLink,
                    rootDomain: sponsor.rootDomain,
                    tags: sponsor.tags,
                    newsletterSponsored: sponsor.newsletterSponsored,
                    subscriberCount: sponsor.subscriberCount,
                    businessContact: sponsor.businessContact
                }));
                
                await Sponsor.insertMany(approvedSponsors);
                
                // Delete from potential sponsors
                await PotentialSponsor.deleteMany({ _id: { $in: sponsorIds } });
                
                result = { message: `Approved ${sponsorIds.length} sponsors` };
                break;
                
            case 'reject':
                // Add domains to denied list and delete from potential
                const sponsorsToReject = await PotentialSponsor.find({ _id: { $in: sponsorIds } });
                
                // Add to denied list
                const deniedEntries = sponsorsToReject
                    .filter(sponsor => sponsor.rootDomain)
                    .map(sponsor => ({
                        rootDomain: sponsor.rootDomain,
                        reason: 'Bulk rejected by admin',
                        dateDenied: new Date()
                    }));
                
                if (deniedEntries.length > 0) {
                    await DeniedSponsorLink.insertMany(deniedEntries);
                }
                
                // Delete from potential sponsors
                await PotentialSponsor.deleteMany({ _id: { $in: sponsorIds } });
                
                result = { message: `Rejected ${sponsorIds.length} sponsors` };
                break;
                
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error performing bulk action:', error);
        res.status(500).json({ error: 'Error performing bulk action' });
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
    try {
        console.log("Starting Python Newsletter Scraper from admin dashboard...");
        
        // Path to the Python API wrapper
        const pythonScriptPath = path.join(__dirname, '../../newsletter_scraper/api_wrapper.py');
        
        // Spawn Python process - try python3 first, then python
        const pythonCommands = ['python3', 'python'];
        let pythonProcess;
        let pythonCommand;
        
        for (const cmd of pythonCommands) {
            try {
                pythonProcess = spawn(cmd, [pythonScriptPath], {
                    cwd: path.join(__dirname, '../../newsletter_scraper'),
                    env: {
                        ...process.env,
                        PYTHONPATH: path.join(__dirname, '../../newsletter_scraper')
                    }
                });
                pythonCommand = cmd;
                break; // Success, exit the loop
            } catch (error) {
                console.log(`Failed to spawn ${cmd}, trying next...`);
                continue;
            }
        }
        
        if (!pythonProcess) {
            return res.status(500).json({
                success: false,
                message: 'Failed to start Python process - no Python interpreter found',
                error: 'No Python interpreter available'
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
            errorOutput += data.toString();
        });
        
        // Handle process completion
        pythonProcess.on('close', (code) => {
            console.log(`Python scraper process exited with code ${code}`);
            
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    console.log("Python scraper completed successfully:", result);
                    if (!res.headersSent) {
                        res.status(200).json({
                            success: true,
                            message: 'Scraper completed successfully',
                            result: result
                        });
                    }
                } catch (parseError) {
                    console.error("Error parsing Python output:", parseError);
                    if (!res.headersSent) {
                        res.status(200).json({
                            success: true,
                            message: 'Scraper completed (output parsing failed)',
                            rawOutput: output,
                            errorOutput: errorOutput
                        });
                    }
                }
            } else {
                console.error("Python scraper failed with code:", code);
                if (!res.headersSent) {
                    res.status(400).json({
                        success: false,
                        message: 'Scraper failed',
                        exitCode: code,
                        errorOutput: errorOutput,
                        output: output
                    });
                }
            }
        });
        
        // Handle process errors
        pythonProcess.on('error', (error) => {
            console.error("Failed to start Python scraper:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to start scraper',
                    error: error.message
                });
            }
        });
        
        // Set timeout (10 minutes for admin)
        setTimeout(() => {
            if (!pythonProcess.killed) {
                console.log("Python scraper timeout - killing process");
                pythonProcess.kill();
                if (!res.headersSent) {
                    res.status(408).json({
                        success: false,
                        message: 'Scraper timeout',
                        timeout: true
                    });
                }
            }
        }, 600000); // 10 minutes
        
    } catch (error) {
        console.error("Error running Python scraper:", error);
        res.status(500).json({
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

module.exports = router;
