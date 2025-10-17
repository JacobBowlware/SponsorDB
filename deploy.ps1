# Deploy SponsorDB to Heroku with Python support

Write-Host "Deploying SponsorDB to Heroku..." -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check if Heroku CLI is installed
try {
    heroku --version | Out-Null
} catch {
    Write-Host "Error: Heroku CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Add Python buildpack
Write-Host "Adding Python buildpack..." -ForegroundColor Yellow
heroku buildpacks:add heroku/python

# Add Node.js buildpack
Write-Host "Adding Node.js buildpack..." -ForegroundColor Yellow
heroku buildpacks:add heroku/nodejs

# Verify buildpacks
Write-Host "Current buildpacks:" -ForegroundColor Yellow
heroku buildpacks

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "Fix Python scraper and add Heroku Python support"

# Deploy to Heroku
Write-Host "Deploying to Heroku..." -ForegroundColor Yellow
git push heroku main

Write-Host "Deployment complete! Check logs with: heroku logs --tail" -ForegroundColor Green













