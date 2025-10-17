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

// Helper function to determine correct status
function determineStatus(sponsor) {
    const hasContact = hasContactInfo(sponsor);
    const isApproved = sponsor.status === 'approved' || sponsor.analysisStatus === 'complete';
    
    if (isApproved && hasContact) {
        return {
            status: 'approved',
            analysisStatus: 'complete'
        };
    } else if (isApproved && !hasContact) {
        return {
            status: 'approved',
            analysisStatus: 'complete'
        };
    } else if (!isApproved && hasContact) {
        return {
            status: 'pending',
            analysisStatus: 'pending'
        };
    } else {
        return {
            status: 'pending',
            analysisStatus: 'pending'
        };
    }
}

async function fixSponsorStatuses() {
    try {
        console.log('🔧 Starting sponsor status fix...');
        
        // Fix PotentialSponsor collection
        console.log('📋 Processing PotentialSponsor collection...');
        const potentialSponsors = await PotentialSponsor.find({});
        console.log(`Found ${potentialSponsors.length} potential sponsors`);
        
        let potentialUpdated = 0;
        for (const sponsor of potentialSponsors) {
            const newStatus = determineStatus(sponsor);
            
            // Only update if status needs to change
            if (sponsor.status !== newStatus.status || sponsor.analysisStatus !== newStatus.analysisStatus) {
                await PotentialSponsor.updateOne(
                    { _id: sponsor._id },
                    { 
                        $set: { 
                            status: newStatus.status,
                            analysisStatus: newStatus.analysisStatus
                        }
                    }
                );
                potentialUpdated++;
                console.log(`✅ Updated potential sponsor: ${sponsor.sponsorName} -> ${newStatus.status}/${newStatus.analysisStatus}`);
            }
        }
        
        // Fix Sponsor collection
        console.log('📋 Processing Sponsor collection...');
        const sponsors = await Sponsor.find({});
        console.log(`Found ${sponsors.length} sponsors`);
        
        let sponsorUpdated = 0;
        for (const sponsor of sponsors) {
            const newStatus = determineStatus(sponsor);
            
            // Only update if status needs to change
            if (sponsor.status !== newStatus.status || sponsor.analysisStatus !== newStatus.analysisStatus) {
                await Sponsor.updateOne(
                    { _id: sponsor._id },
                    { 
                        $set: { 
                            status: newStatus.status,
                            analysisStatus: newStatus.analysisStatus
                        }
                    }
                );
                sponsorUpdated++;
                console.log(`✅ Updated sponsor: ${sponsor.sponsorName} -> ${newStatus.status}/${newStatus.analysisStatus}`);
            }
        }
        
        console.log('\n🎉 Status fix completed!');
        console.log(`📊 PotentialSponsor: ${potentialUpdated} updated`);
        console.log(`📊 Sponsor: ${sponsorUpdated} updated`);
        console.log(`📊 Total: ${potentialUpdated + sponsorUpdated} sponsors updated`);
        
        // Show summary by status
        console.log('\n📈 Status Summary:');
        
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
        
    } catch (error) {
        console.error('❌ Error fixing sponsor statuses:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the fix
fixSponsorStatuses();
