import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration (matching your existing Node.js setup)
mongo_password = os.getenv('mongoPassword')
if mongo_password:
    MONGODB_URI = f"mongodb+srv://jacobbowlware:{mongo_password}@sponsor-db.zsf5b.mongodb.net/?retryWrites=true&w=majority&appName=sponsor-db"
else:
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')

DATABASE_NAME = os.getenv('DATABASE_NAME', 'test')  # Use 'test' database as requested
COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'sponsors')

# Email Configuration (using your actual Heroku config vars)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'imap.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '993'))
EMAIL_USER = os.getenv('EMAIL_USER', 'sponsordatabase@gmail.com')
EMAIL_PASSWORD = os.getenv('sponsorDBGmailPass')  # This matches your Heroku config
EMAIL_FOLDER = os.getenv('EMAIL_FOLDER', 'INBOX')

# Clean the password (remove spaces that Gmail App Passwords sometimes have)
if EMAIL_PASSWORD:
    EMAIL_PASSWORD = EMAIL_PASSWORD.replace(' ', '')

# OpenAI Configuration (using your actual Heroku config vars)
OPENAI_API_KEY = os.getenv('sponsorDB_openAIKey')  # This matches your Heroku config

# Scraping Configuration
MAX_EMAILS_PER_RUN = int(os.getenv('MAX_EMAILS_PER_RUN', '30'))  # Increased for higher volume processing
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.3'))  # Much more lenient for detection
MIN_SPONSOR_INDICATORS = int(os.getenv('MIN_SPONSOR_INDICATORS', '2'))  # Reduced from 5 to 2
MIN_SPONSOR_SECTION_MARKERS = int(os.getenv('MIN_SPONSOR_SECTION_MARKERS', '1'))  # Reduced from 4 to 1

# Sponsor Detection Keywords (expanded with realistic newsletter language)
SPONSOR_MARKERS = [
    'SPONSORED BY',
    'BROUGHT TO YOU BY', 
    'PRESENTED BY',
    'PARTNER CONTENT',
    'PAID PARTNERSHIP',
    'ADVERTISEMENT',
    'SPONSORED CONTENT',
    'SPONSORED:',
    'PARTNER:',
    'SPONSOR',
    'PARTNER',
    'PAID CONTENT',
    'ADVERTISING',
    'PARTNERED WITH',
    'IN PARTNERSHIP WITH',
    'PROMOTED BY',
    'PAID FOR BY',
    'FEATURED TOOLS',
    'COMMUNITY SPOTLIGHT',
    'RECOMMENDED',
    'THANKS TO OUR FRIENDS',
    'POWERED BY',
    'SUPPORTED BY',
    'IN PARTNERSHIP',
    'SPONSORED',
    'PARTNERSHIP',
    # New realistic newsletter keywords
    'PARTNER SPOTLIGHT',
    'FEATURED TOOL',
    'COMMUNITY SPOTLIGHT',
    'BROUGHT TO YOU BY',
    'THANKS TO OUR FRIENDS AT',
    'SPECIAL PRICING',
    'DISCOUNT CODE',
    'UTM_SOURCE',
    'TRY IT FREE',
    'GET STARTED AT',
    'USE CODE',
    'EXCLUSIVE OFFER',
    'LIMITED TIME',
    'DEAL OF THE WEEK',
    'TOOL OF THE WEEK',
    'APP OF THE WEEK',
    'SERVICE OF THE WEEK',
    'PRODUCT OF THE WEEK',
    'SPONSORED POST',
    'PAID POST',
    'NATIVE AD',
    'BRANDED CONTENT',
    'AFFILIATE LINK',
    'REFERRAL LINK',
    'PROMO CODE',
    'COUPON CODE',
    'SAVE WITH CODE',
    'GET DISCOUNT',
    'SPECIAL DEAL',
    'EXCLUSIVE DEAL'
]

# Business Contact Keywords (used for filtering candidate emails)
BUSINESS_EMAIL_PATTERNS = [
    'partnerships@',
    'partners@',
    'partner@',
    'press@',
    'pr@',
    'media@',
    'marketing@',
    'business@',
    'advertising@',
    'sponsors@',
    'contact@',
    'hello@',
    'info@',
    'support@',
    'help@'
]

# Excluded Domains - Focus on non-sponsor content sites only
EXCLUDED_DOMAINS = [
    # Social Media Platforms (definitely not sponsors)
    'facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'instagram.com',
    'youtube.com', 'tiktok.com', 'reddit.com', 'pinterest.com', 'threads.net',
    
    # Generic Content/Blog Sites (not B2B sponsors)
    'wikipedia.org', 'github.com', 'stackoverflow.com', 'quora.com',
    'producthunt.com', 'hackernews.com', 'medium.com',
    
    # News Sites (not typically sponsors)
    'techcrunch.com', 'venturebeat.com', 'forbes.com', 'bloomberg.com', 
    'reuters.com', 'cnn.com', 'bbc.com',
    
    # CDN & Infrastructure (not sponsors)
    'cdn.com', 'cloudfront.net', 'amazonaws.com', 'googleusercontent.com',
    'github.io', 'netlify.app', 'vercel.app', 'herokuapp.com',
    
    # Newsletter self-promotion (newsletter advertising itself)
    'stackedmarketer.com', 'tldrnewsletter.com', 'neatprompts.com',
    'thehustle.co', 'interestingengineering.com', 'thedailyupside.com',
    'pernasresearch.com', 'doraverse.com', 'tldr.tech'
]

# Tags (matching your existing emailMonitor.js setup)
TAGS = [
    "Technology", "Charity", "Crypto", "Software", "Productivity", "Health", 
    "Social", "Sports", "Finance", "Business", "Retail", "Marketing", 
    "Education", "Entertainment", "Travel", "Lifestyle", "Fashion", "Beauty", 
    "Food", "Music", "Art", "Politics", "Social", "Ecommerce", "Mental Health", 
    "AI", "Affiliate", "Other"
]

# Affiliate Program Detection Keywords
AFFILIATE_INDICATORS = [
    'AFFILIATE LINK', 'REFERRAL LINK', 'AFFILIATE PROGRAM', 'REFERRAL PROGRAM',
    'COMMISSION', 'REFERRAL BONUS', 'AFFILIATE COMMISSION', 'REFERRAL REWARD',
    'PARTNER PROGRAM', 'AFFILIATE PARTNER', 'REFERRAL CODE', 'AFFILIATE CODE',
    'EARN COMMISSION', 'GET PAID', 'REFERRAL EARNINGS', 'AFFILIATE EARNINGS',
    'SIGN UP WITH CODE', 'USE REFERRAL', 'JOIN AFFILIATE', 'BECOME AFFILIATE',
    'AFFILIATE MARKETING', 'REFERRAL MARKETING', 'PARTNER EARNINGS',
    'AFFILIATE REWARDS', 'REFERRAL REWARDS', 'COMMISSION RATE',
    'AFFILIATE DISCOUNT', 'REFERRAL DISCOUNT', 'PARTNER DISCOUNT'
]

# Non-sponsor companies (only major tech giants that don't typically sponsor newsletters)
NON_SPONSOR_COMPANIES = [
    'google', 'microsoft', 'facebook', 'twitter', 'linkedin', 'instagram', 
    'youtube', 'tiktok', 'apple', 'amazon', 'meta', 'github'
]

# Known legitimate sponsors (whitelist to ensure they pass validation)
KNOWN_SPONSORS = [
    'stripe', 'notion', 'hubspot', 'mailchimp', 'paddle', 'linear', 'datadog', 
    'webflow', 'zapier', 'airtable', 'figma', 'slack', 'discord', 'canva',
    'shopify', 'squarespace', 'wix', 'bubble', 'retool', 'supabase', 'vercel',
    'netlify', 'planetscale', 'railway', 'render', 'fly.io', 'doppler'
]

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'newsletter_scraper.log')
