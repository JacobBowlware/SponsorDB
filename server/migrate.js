const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-admin-token-here';

async function runMigration() {
    try {
        console.log('🚀 Starting contact migration...');
        console.log(`📡 API Base URL: ${API_BASE_URL}`);
        
        const response = await axios.post(`${API_BASE_URL}/admin/migrate-contacts`, {}, {
            headers: {
                'x-auth-token': AUTH_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Migration completed successfully!');
        console.log('📊 Results:', JSON.stringify(response.data.results, null, 2));
        
        const { results } = response.data;
        console.log(`\n📈 Summary:`);
        console.log(`   • Total Processed: ${results.totalProcessed}`);
        console.log(`   • Total Errors: ${results.totalErrors}`);
        console.log(`   • Potential Sponsors: ${results.potentialSponsors.processed} processed, ${results.potentialSponsors.errors} errors`);
        console.log(`   • Sponsors: ${results.sponsors.processed} processed, ${results.sponsors.errors} errors`);

        if (results.totalErrors > 0) {
            console.log('\n⚠️  Some errors occurred during migration. Check the details above.');
        } else {
            console.log('\n🎉 All records migrated successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.error('🔐 Authentication failed. Please check your AUTH_TOKEN.');
        } else if (error.response?.status === 403) {
            console.error('🚫 Access denied. Please ensure you have admin privileges.');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🌐 Connection refused. Please ensure the server is running.');
        }
        
        process.exit(1);
    }
}

// Run the migration
runMigration();





















