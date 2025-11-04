const express = require('express');
const router = express.Router();
const { PotentialSponsor, validatePotentialSponsor } = require('../models/potentialSponsor');
const { Sponsor } = require('../models/sponsor');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Check if a sponsor already exists in either collection
router.get('/checkDuplicate', async (req, res) => {
    try {
        const { sponsorName, newsletterSponsored, rootDomain } = req.query;
        
        if (!sponsorName || !newsletterSponsored) {
            return res.status(400).send('Missing required parameters');
        }
        
        // Check if sponsor exists in PotentialSponsor collection
        const potentialSponsorExists = await PotentialSponsor.findOne({
            $or: [
                // Check by name and newsletter
                {
                    sponsorName: sponsorName,
                    newsletterSponsored: newsletterSponsored
                },
                // Check by root domain and newsletter if rootDomain is provided
                ...(rootDomain ? [{
                    rootDomain: rootDomain,
                    newsletterSponsored: newsletterSponsored
                }] : [])
            ]
        });
        
        // Check if sponsor exists in Sponsor collection
        const sponsorExists = await Sponsor.findOne({
            $or: [
                // Check by name and newsletter
                {
                    sponsorName: sponsorName,
                    newsletterSponsored: newsletterSponsored
                },
                // Check by root domain and newsletter if rootDomain is provided
                ...(rootDomain ? [{
                    rootDomain: rootDomain,
                    newsletterSponsored: newsletterSponsored
                }] : [])
            ]
        });
        
        // Return true if sponsor exists in either collection
        const exists = !!potentialSponsorExists || !!sponsorExists;
        
        res.status(200).send({ exists });
    } catch (error) {
        console.error('Error checking for duplicate sponsor:', error);
        res.status(500).send('Error checking for duplicate sponsor');
    }
});


// Legacy emailMonitor route - now redirects to Python scraper
router.get('/emailMonitor', async (req, res) => {
    // Redirect to the new Python scraper endpoint
    res.redirect('/api/potentialSponsors/pythonScraper');
});

// Public endpoint to run Python Newsletter Scraper
// Used by Heroku Scheduler - NO AUTH REQUIRED
// This endpoint processes 75 emails per run
router.get('/pythonScraper', async (req, res) => {
    const { spawn } = require('child_process');
    const path = require('path');
    
    try {
        console.log("Starting Python Newsletter Scraper...");
        
        // Path to the Python API wrapper
        const pythonScriptPath = path.join(__dirname, '../newsletter_scraper/api_wrapper.py');
        
        // Spawn Python process
        const pythonProcess = spawn('python3', [pythonScriptPath], {
            cwd: path.join(__dirname, '../newsletter_scraper'),
            env: {
                ...process.env,
                // Ensure Python can find the modules
                PYTHONPATH: path.join(__dirname, '../newsletter_scraper'),
                MAX_EMAILS_PER_RUN: '75'  // Process 75 emails per run
            }
        });
        
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
                    // Parse JSON output from Python
                    const result = JSON.parse(output);
                    console.log("Python scraper completed successfully:", result);
                    res.status(200).json({
                        success: true,
                        message: 'Python Newsletter Scraper completed successfully',
                        pythonResult: result
                    });
                } catch (parseError) {
                    console.error("Error parsing Python output:", parseError);
                    res.status(200).json({
                        success: true,
                        message: 'Python Newsletter Scraper completed (output parsing failed)',
                        rawOutput: output,
                        errorOutput: errorOutput
                    });
                }
            } else {
                console.error("Python scraper failed with code:", code);
                console.error("Error output:", errorOutput);
                res.status(400).json({
                    success: false,
                    message: 'Python Newsletter Scraper failed',
                    exitCode: code,
                    errorOutput: errorOutput,
                    output: output
                });
            }
        });
        
        // Handle process errors
        pythonProcess.on('error', (error) => {
            console.error("Failed to start Python scraper:", error);
            res.status(500).json({
                success: false,
                message: 'Failed to start Python Newsletter Scraper',
                error: error.message
            });
        });
        
        // Set timeout (5 minutes)
        setTimeout(() => {
            if (!pythonProcess.killed) {
                console.log("Python scraper timeout - killing process");
                pythonProcess.kill();
                res.status(408).json({
                    success: false,
                    message: 'Python Newsletter Scraper timeout',
                    timeout: true
                });
            }
        }, 300000); // 5 minutes
        
    } catch (error) {
        console.error("Error running Python scraper:", error);
        res.status(500).json({
            success: false,
            message: 'Error running Python Newsletter Scraper',
            error: error.message
        });
    }
});

// Get all potential sponsors
router.get('/', [auth, admin], async (req, res) => {
    const potentialSponsors = await PotentialSponsor.find();
    res.status(200).send(potentialSponsors);
});

// Create a new potential sponsor
router.post('/', async (req, res) => {
    // Validate the request body (which could be either a potential sponsor, or an array of potential sponsors for one Newsletter)
    let sponsors = req.body.sponsors;

    if (!Array.isArray(sponsors)) {
        sponsors = [sponsors];
    }

    const seenNewsletter = await Sponsor.findOne({
        newsletterSponsored: sponsors[0].newsletterSponsored, subscriberCount: {
            $gt: 0
        }
    }); // Only get if subscriberCount > 0
    if (seenNewsletter) {
        // Add the newsletters subscriber count to the potential sponsors
        sponsors.forEach(sponsor => {
            sponsor.subscriberCount = seenNewsletter.subscriberCount;
        });
    }

    for (const sponsor of sponsors) {
        console.log("Validating sponsor:", sponsor);
        const { error } = validatePotentialSponsor(sponsor);
        if (error) {
            return res
                .status(400)
                .send(error.details[0].message);
        }
    }

    // Save the potential sponsors to the database
    await PotentialSponsor.insertMany(sponsors).then((sponsors) => {
        console.log("-----POTENTIAL SPONSORS SAVED TO DATBASE-----", sponsors);
        res.send(sponsors);
    }).catch((e) => {
        res.status(400).send("Error saving to database...");
    });
});

router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const potentialSponsor = await PotentialSponsor.findByIdAndDelete(req.params.id);

        if (!potentialSponsor) {
            return res.status(400).send('The potential sponsor with the given ID was not found.');
        }

        res.send(potentialSponsor);
    }
    catch (ex) {
        console.log("Error deleting potential sponsor...", ex);
        return res.status(400).send(ex);
    }
});

module.exports = router;
