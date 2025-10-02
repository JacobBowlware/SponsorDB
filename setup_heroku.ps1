# Setup script for Heroku deployment with Python support

Write-Host "Setting up Heroku for SponsorDB with Python support..." -ForegroundColor Green

# Add Python buildpack to Heroku app
Write-Host "Adding Python buildpack..." -ForegroundColor Yellow
heroku buildpacks:add heroku/python

# Add Node.js buildpack (if not already present)
Write-Host "Adding Node.js buildpack..." -ForegroundColor Yellow
heroku buildpacks:add heroku/nodejs

# Set Python version
Write-Host "Setting Python version..." -ForegroundColor Yellow
"python-3.11.7" | Out-File -FilePath "runtime.txt" -Encoding UTF8

# Create requirements.txt for Python dependencies
Write-Host "Creating requirements.txt..." -ForegroundColor Yellow
@"
requests==2.31.0
beautifulsoup4==4.12.2
lxml==4.9.3
pandas==2.1.4
python-dotenv==1.0.0
"@ | Out-File -FilePath "requirements.txt" -Encoding UTF8

Write-Host "Setup complete! Deploy with: git push heroku main" -ForegroundColor Green



