// Test script to verify Python scraper integration
const { spawn } = require('child_process');
const path = require('path');

console.log('Testing Python Newsletter Scraper Integration...');

// Path to the Python API wrapper
const pythonScriptPath = path.join(__dirname, 'newsletter_scraper/api_wrapper.py');

console.log('Python script path:', pythonScriptPath);

// Spawn Python process
const pythonProcess = spawn('python3', [pythonScriptPath], {
    cwd: path.join(__dirname, 'newsletter_scraper'),
    env: {
        ...process.env,
        PYTHONPATH: path.join(__dirname, 'newsletter_scraper')
    }
});

let output = '';
let errorOutput = '';

// Capture stdout
pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log('Python stdout:', data.toString());
});

// Capture stderr
pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log('Python stderr:', data.toString());
});

// Handle process completion
pythonProcess.on('close', (code) => {
    console.log(`\nPython process exited with code ${code}`);
    
    if (code === 0) {
        try {
            const result = JSON.parse(output);
            console.log('✅ Python scraper completed successfully!');
            console.log('Result:', JSON.stringify(result, null, 2));
        } catch (parseError) {
            console.log('⚠️  Python completed but output parsing failed');
            console.log('Raw output:', output);
            console.log('Error output:', errorOutput);
        }
    } else {
        console.log('❌ Python scraper failed');
        console.log('Error output:', errorOutput);
        console.log('Output:', output);
    }
});

// Handle process errors
pythonProcess.on('error', (error) => {
    console.error('❌ Failed to start Python process:', error);
});

// Set timeout
setTimeout(() => {
    if (!pythonProcess.killed) {
        console.log('⏰ Python process timeout - killing');
        pythonProcess.kill();
    }
}, 60000); // 1 minute timeout for testing
