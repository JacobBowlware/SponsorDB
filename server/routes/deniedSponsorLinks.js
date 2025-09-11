const express = require('express');
const router = express.Router();
const { DeniedSponsorLink, validateDeniedSponsorLink } = require('../models/deniedSponsorLink');
const auth = require('../middleware/auth');

// POST - Add a new denied sponsor link
router.post('/', auth, async (req, res) => {
    try {
        const { error } = validateDeniedSponsorLink(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const deniedLink = new DeniedSponsorLink({
            rootDomain: req.body.rootDomain,
            deniedBy: req.user._id,
            reason: req.body.reason
        });

        await deniedLink.save();
        res.send(deniedLink);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// GET - Get all denied sponsor links
router.get('/', auth, async (req, res) => {
    try {
        const deniedLinks = await DeniedSponsorLink.find().sort('dateDenied');
        res.send(deniedLinks);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// DELETE - Remove a denied sponsor link
router.delete('/:id', auth, async (req, res) => {
    try {
        const deniedLink = await DeniedSponsorLink.findByIdAndRemove(req.params.id);
        if (!deniedLink) return res.status(404).send('Denied sponsor link not found');
        res.send(deniedLink);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router; 