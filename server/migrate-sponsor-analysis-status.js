const mongoose = require('mongoose');
const { Sponsor } = require('./models/sponsor');
const { PotentialSponsor } = require('./models/potentialSponsor');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const mongoPassword = process.env.mongoPassword;
        const uri = "mongodb+srv://jacobbowlware:" + mongoPassword + "@sponsor-db.zsf5b.mongodb.net/?retryWrites=true&w=majority&appName=sponsor-db";
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const migrateSponsorAnalysisStatus = async () => {
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
                    const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
                    const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';

                    let newAnalysisStatus = sponsor.analysisStatus;
                    let newContactMethod = 'none';

                    if (hasEmail && hasApplication) {
                        newContactMethod = 'both';
                        newAnalysisStatus = 'complete';
                    } else if (hasEmail) {
                        newContactMethod = 'email';
                        newAnalysisStatus = 'complete';
                    } else if (hasApplication) {
                        newContactMethod = 'application';
                        newAnalysisStatus = 'complete';
                    } else {
                        newContactMethod = 'none';
                        newAnalysisStatus = 'pending';
                    }

                    if (sponsor.analysisStatus !== newAnalysisStatus || sponsor.contactMethod !== newContactMethod) {
                        await Model.findByIdAndUpdate(sponsor._id, {
                            $set: {
                                analysisStatus: newAnalysisStatus,
                                contactMethod: newContactMethod
                            }
                        });
                        
                        if (newAnalysisStatus === 'pending') {
                            results.updatedToPending++;
                        } else {
                            results.updatedToComplete++;
                        }
                        
                        results.details.push({
                            id: sponsor._id,
                            name: sponsor.sponsorName,
                            oldStatus: sponsor.analysisStatus,
                            newStatus: newAnalysisStatus,
                            oldContactMethod: sponsor.contactMethod,
                            newContactMethod: newContactMethod,
                            message: 'Status and/or contact method updated'
                        });
                        
                        console.log(`Updated ${sponsor.sponsorName}: ${sponsor.analysisStatus} -> ${newAnalysisStatus}, contact: ${sponsor.contactMethod} -> ${newContactMethod}`);
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
        
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run migration if called directly
if (require.main === module) {
    connectDB().then(() => {
        migrateSponsorAnalysisStatus();
    });
}

module.exports = { migrateSponsorAnalysisStatus };
