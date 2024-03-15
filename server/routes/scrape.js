const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscribe = require('../middleware/subscribe');
const admin = require('../middleware/admin');
const spawn = require('child_process').spawn;

router.post('/', async (req, res) => {
    // Call Python Scrape Script
    // Store data in MongoDB
    const pythonProcess = spawn('python', ['./scrape/main.py']);

    pythonProcess.stdout.on('data', (data) => {
        console.log(data.toString());
    });
})

router.get('/', (req, res) => {
    res.status(200).send("Scrape route");
})

module.exports = router;