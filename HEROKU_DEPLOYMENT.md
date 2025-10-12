# Heroku Deployment Guide for SponsorDB

## Issues Fixed

1. **Python3 not found error**: Fixed by adding Python buildpack and using correct Python command
2. **Headers already sent error**: Fixed by implementing proper response handling with `responseSent` flag
3. **Server crashes**: Fixed by preventing multiple response attempts

## Deployment Steps

### 1. Add Python Buildpack

```bash
# Add Python buildpack to your Heroku app
heroku buildpacks:add heroku/python

# Add Node.js buildpack (if not already present)
heroku buildpacks:add heroku/nodejs

# Verify buildpacks
heroku buildpacks
```

### 2. Set Python Version

The `runtime.txt` file specifies Python 3.11.7. This is already created in the root directory.

### 3. Install Python Dependencies

The `requirements.txt` file contains the necessary Python packages:
- requests==2.31.0
- beautifulsoup4==4.12.2
- lxml==4.9.3
- pandas==2.1.4
- python-dotenv==1.0.0

### 4. Deploy

```bash
# Commit all changes
git add .
git commit -m "Fix Python scraper and add Heroku Python support"

# Deploy to Heroku
git push heroku main
```

## Files Added/Modified

### New Files:
- `app.json` - Heroku app configuration with buildpacks
- `runtime.txt` - Python version specification
- `requirements.txt` - Python dependencies
- `test_python.py` - Python test script
- `setup_heroku.ps1` - PowerShell setup script
- `setup_heroku.sh` - Bash setup script

### Modified Files:
- `server/routes/admin.js` - Fixed Python scraper execution and response handling

## Key Changes in admin.js

1. **Response Handling**: Added `responseSent` flag to prevent multiple responses
2. **Python Command**: Changed from `python3` to `python` for Heroku compatibility
3. **Error Handling**: Improved error messages and fallback behavior
4. **Environment Detection**: Added Heroku environment detection

## Testing

After deployment, test the Python scraper by:

1. Go to your admin dashboard
2. Click "Run Scraper" button
3. Check the logs: `heroku logs --tail`

## Troubleshooting

### If Python is still not found:
1. Verify buildpacks: `heroku buildpacks`
2. Check Python version: `heroku run python --version`
3. Test Python script: `heroku run python test_python.py`

### If server still crashes:
1. Check logs: `heroku logs --tail`
2. Look for "Headers already sent" errors
3. Verify the `responseSent` flag is working

## Environment Variables

Make sure these are set in Heroku:
- `NODE_ENV=production`
- `DYNO` (automatically set by Heroku)
- All your existing environment variables (MongoDB, Stripe, etc.)

## Buildpack Order

The buildpacks should be in this order:
1. `heroku/nodejs` (first)
2. `heroku/python` (second)

This ensures Node.js dependencies are installed first, then Python dependencies.









