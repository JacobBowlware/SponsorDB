const mongoose = require('mongoose');
const config = require('config');

// Connect to MongoDB
mongoose.connect(config.get('mongoURI'), {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Import models
const Sponsor = require('./models/sponsor');
const PotentialSponsor = require('./models/potentialSponsor');

// Helper function to check if sponsor has contact info
function hasContactInfo(sponsor) {
    const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
    const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';
    const hasAffiliateLink = sponsor.affiliateSignupLink && sponsor.affiliateSignupLink.trim() !== '';
    const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';
    
    return hasEmail || hasApplication || hasAffiliateLink || hasBusinessContact;
}

// Helper function to determine if sponsor is affiliate based on tags or businessContact
function isAffiliateSponsor(sponsor) {
    // Check if tags contain 'affiliate' or 'Affiliate'
    const hasAffiliateTag = sponsor.tags && (
        sponsor.tags.some(tag => tag.toLowerCase().includes('affiliate')) ||
        (typeof sponsor.tags === 'string' && sponsor.tags.toLowerCase().includes('affiliate'))
    );
    
    // Check if businessContact looks like an affiliate link
    const hasAffiliateContact = sponsor.businessContact && 
        (sponsor.businessContact.includes('affiliate') || 
         sponsor.businessContact.includes('partner') ||
         sponsor.businessContact.includes('ref.') ||
         sponsor.businessContact.includes('utm_'));
    
    return hasAffiliateTag || hasAffiliateContact;
}

// Helper function to determine correct status
function determineStatus(sponsor) {
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
}

// Helper function to extract affiliate info from businessContact
function extractAffiliateInfo(sponsor) {
    if (!sponsor.businessContact) return null;
    
    const businessContact = sponsor.businessContact.trim();
    if (businessContact === '') return null;
    
    return {
        isAffiliateProgram: true,
        affiliateSignupLink: businessContact,
        commissionInfo: 'Commission rates, terms, etc.' // Default placeholder
    };
}

// Helper function to normalize tags
function normalizeTags(tags) {
    if (!tags) return [];
    
    if (Array.isArray(tags)) {
        return tags.filter(tag => tag && tag.trim() !== '');
    }
    
    if (typeof tags === 'string') {
        return tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    }
    
    return [];
}

// Helper function to consolidate sponsor data
function consolidateSponsorData(sponsor, source) {
    const isAffiliate = isAffiliateSponsor(sponsor);
    const affiliateInfo = isAffiliate ? extractAffiliateInfo(sponsor) : null;
    const newStatus = determineStatus(sponsor);
    const normalizedTags = normalizeTags(sponsor.tags);
    
    return {
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
        
        // Affiliate info
        isAffiliateProgram: isAffiliate,
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
        source: source, // 'potential' or 'sponsor'
        consolidatedAt: new Date(),
        originalId: sponsor._id
    };
}

async function consolidateSponsors() {
    try {
        console.log('🔄 Starting comprehensive sponsor consolidation...');
        
        const results = {
            potentialSponsors: { processed: 0, consolidated: 0, errors: 0 },
            sponsors: { processed: 0, consolidated: 0, errors: 0 },
            details: []
        };
        
        // Process PotentialSponsor collection
        console.log('📋 Processing PotentialSponsor collection...');
        const potentialSponsors = await PotentialSponsor.find({});
        results.potentialSponsors.processed = potentialSponsors.length;
        
        for (const sponsor of potentialSponsors) {
            try {
                const consolidatedData = consolidateSponsorData(sponsor, 'potential');
                
                // Update the existing document with consolidated data
                await PotentialSponsor.updateOne(
                    { _id: sponsor._id },
                    { 
                        $set: consolidatedData,
                        $unset: { analysisStatus: 1 } // Remove old analysisStatus field
                    }
                );
                
                results.potentialSponsors.consolidated++;
                results.details.push(`Consolidated potential sponsor: ${sponsor.sponsorName} -> ${consolidatedData.status} (Affiliate: ${consolidatedData.isAffiliateProgram})`);
            } catch (error) {
                results.potentialSponsors.errors++;
                results.details.push(`Error consolidating potential sponsor ${sponsor.sponsorName}: ${error.message}`);
            }
        }
        
        // Process Sponsor collection
        console.log('📋 Processing Sponsor collection...');
        const sponsors = await Sponsor.find({});
        results.sponsors.processed = sponsors.length;
        
        for (const sponsor of sponsors) {
            try {
                const consolidatedData = consolidateSponsorData(sponsor, 'sponsor');
                
                // Update the existing document with consolidated data
                await Sponsor.updateOne(
                    { _id: sponsor._id },
                    { 
                        $set: consolidatedData,
                        $unset: { analysisStatus: 1 } // Remove old analysisStatus field
                    }
                );
                
                results.sponsors.consolidated++;
                results.details.push(`Consolidated sponsor: ${sponsor.sponsorName} -> ${consolidatedData.status} (Affiliate: ${consolidatedData.isAffiliateProgram})`);
            } catch (error) {
                results.sponsors.errors++;
                results.details.push(`Error consolidating sponsor ${sponsor.sponsorName}: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Consolidation completed!');
        console.log(`📊 PotentialSponsor: ${results.potentialSponsors.consolidated} consolidated`);
        console.log(`📊 Sponsor: ${results.sponsors.consolidated} consolidated`);
        console.log(`📊 Total: ${results.potentialSponsors.consolidated + results.sponsors.consolidated} sponsors consolidated`);
        
        // Show summary by status
        console.log('\n📈 Status Summary After Consolidation:');
        
        const potentialStatusCounts = await PotentialSponsor.aggregate([
            { $group: { _id: { status: '$status', analysisStatus: '$analysisStatus' }, count: { $sum: 1 } } }
        ]);
        
        const sponsorStatusCounts = await Sponsor.aggregate([
            { $group: { _id: { status: '$status', analysisStatus: '$analysisStatus' }, count: { $sum: 1 } } }
        ]);
        
        console.log('PotentialSponsor statuses:');
        potentialStatusCounts.forEach(item => {
            console.log(`  ${item._id.status}/${item._id.analysisStatus}: ${item.count}`);
        });
        
        console.log('Sponsor statuses:');
        sponsorStatusCounts.forEach(item => {
            console.log(`  ${item._id.status}/${item._id.analysisStatus}: ${item.count}`);
        });
        
        // Show affiliate summary
        console.log('\n🔗 Affiliate Summary:');
        const affiliateCount = await PotentialSponsor.countDocuments({ isAffiliateProgram: true }) + 
                              await Sponsor.countDocuments({ isAffiliateProgram: true });
        console.log(`Total affiliate programs: ${affiliateCount}`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Error consolidating sponsors:', error);
        throw error;
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the consolidation
consolidateSponsors();
