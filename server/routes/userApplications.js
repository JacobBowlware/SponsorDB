const express = require('express');
const router = express.Router();
const { UserApplication, validateUserApplication } = require('../models/userApplication');
const auth = require('../middleware/auth');

// Get all applications for the current user
router.get('/', auth, async (req, res) => {
    try {
        const applications = await UserApplication.find({ userId: req.user._id })
            .sort({ dateApplied: -1 });
        
        res.json(applications);
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({ message: 'Error fetching applications' });
    }
});

// Get conversations (active applications)
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await UserApplication.find({ 
            userId: req.user._id,
            status: { $in: ['pending', 'responded', 'follow_up_needed'] }
        }).sort({ lastContactDate: -1 });
        
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Error fetching conversations' });
    }
});

// Create a new application
router.post('/', auth, async (req, res) => {
    try {
        const applicationData = {
            ...req.body,
            userId: req.user._id
        };
        
        const { error } = validateUserApplication(applicationData);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }
        
        const application = new UserApplication(applicationData);
        await application.save();
        
        res.status(201).json(application);
    } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ message: 'Error creating application' });
    }
});

// Update an application
router.put('/:id', auth, async (req, res) => {
    try {
        const application = await UserApplication.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        res.json(application);
    } catch (error) {
        console.error('Error updating application:', error);
        res.status(500).json({ message: 'Error updating application' });
    }
});

// Delete an application
router.delete('/:id', auth, async (req, res) => {
    try {
        const application = await UserApplication.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });
        
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        console.error('Error deleting application:', error);
        res.status(500).json({ message: 'Error deleting application' });
    }
});

module.exports = router;















