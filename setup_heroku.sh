#!/bin/bash

# Setup script for Heroku deployment with Python support

echo "Setting up Heroku for SponsorDB with Python support..."

# Add Python buildpack to Heroku app
echo "Adding Python buildpack..."
heroku buildpacks:add heroku/python

# Add Node.js buildpack (if not already present)
echo "Adding Node.js buildpack..."
heroku buildpacks:add heroku/nodejs

# Set Python version
echo "Setting Python version..."
echo "python-3.11.7" > runtime.txt

# Create requirements.txt for Python dependencies
echo "Creating requirements.txt..."
cat > requirements.txt << EOF
requests==2.31.0
beautifulsoup4==4.12.2
lxml==4.9.3
pandas==2.1.4
python-dotenv==1.0.0
EOF

echo "Setup complete! Deploy with: git push heroku main"



