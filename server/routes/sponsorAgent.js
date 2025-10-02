const express = require('express');
const router = express.Router();
require('../middleware/corHeaders')(router);

// Scheduler endpoint for sponsor agent
router.post('/scheduler-run', async (req, res) => {
    try {
        console.log("Sponsor Agent scheduler run triggered");
        
        // This could trigger any sponsor-related automated tasks
        // For now, just return success
        res.status(200).json({
            success: true,
            message: 'Sponsor Agent scheduler run completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in sponsor agent scheduler:", error);
        res.status(500).json({
            success: false,
            message: 'Sponsor Agent scheduler run failed',
            error: error.message
        });
    }
});

module.exports = router;
