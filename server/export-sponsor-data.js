const mongoose = require('mongoose');
const fs = require('fs');
const config = require('config');

// Connect to MongoDB
mongoose.connect(config.get('mongoURI'), {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Import models
const Sponsor = require('./models/sponsor');
const PotentialSponsor = require('./models/potentialSponsor');

async function exportSponsorData() {
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
        
        // Write to file
        const filename = `sponsor-data-export-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ Data exported to ${filename}`);
        console.log('\n📈 Status Summary:');
        
        // Analyze status distribution
        const statusCounts = {};
        [...sponsors, ...potentialSponsors].forEach(sponsor => {
            const status = sponsor.status || 'missing_status';
            const analysisStatus = sponsor.analysisStatus || 'missing_analysis';
            const key = `${status}/${analysisStatus}`;
            statusCounts[key] = (statusCounts[key] || 0) + 1;
        });
        
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
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
        
        console.log('\n📞 Contact Info Summary:');
        console.log(`  With contact info: ${withContactInfo}`);
        console.log(`  Without contact info: ${withoutContactInfo}`);
        
        // Analyze affiliate programs
        let affiliatePrograms = 0;
        [...sponsors, ...potentialSponsors].forEach(sponsor => {
            if (sponsor.isAffiliateProgram) {
                affiliatePrograms++;
            }
        });
        
        console.log('\n🔗 Affiliate Programs:');
        console.log(`  Total affiliate programs: ${affiliatePrograms}`);
        
    } catch (error) {
        console.error('❌ Error exporting sponsor data:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the export
exportSponsorData();
