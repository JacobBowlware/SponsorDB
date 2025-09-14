import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'sponsor_trail')
COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'sponsors')

# Email Configuration (matching your existing emailMonitor.js setup)
EMAIL_HOST = os.getenv('EMAIL_HOST', 'imap.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '993'))
EMAIL_USER = os.getenv('EMAIL_USER', 'sponsordatabase@gmail.com')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')  # Uses sponsorDBGmailPass from your env
EMAIL_FOLDER = os.getenv('EMAIL_FOLDER', 'INBOX')

# OpenAI Configuration (matching your existing setup)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')  # Uses sponsorDB_openAIKey from your env

# Scraping Configuration
MAX_EMAILS_PER_RUN = int(os.getenv('MAX_EMAILS_PER_RUN', '50'))
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.95'))  # Much stricter
MIN_SPONSOR_INDICATORS = int(os.getenv('MIN_SPONSOR_INDICATORS', '5'))  # Much higher requirement
MIN_SPONSOR_SECTION_MARKERS = int(os.getenv('MIN_SPONSOR_SECTION_MARKERS', '4'))  # New strict requirement

# Sponsor Detection Keywords (matching your existing emailMonitor.js setup)
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
    'PAID FOR BY'
]

# Business Contact Keywords
BUSINESS_EMAIL_PATTERNS = [
    'partnerships@',
    'marketing@',
    'business@',
    'advertising@',
    'sponsors@',
    'partners@',
    'media@'
]

# Excluded Domains
EXCLUDED_DOMAINS = [
    'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
    'youtube.com', 'tiktok.com', 'reddit.com', 'medium.com',
    'substack.com', 'ghost.io', 'wordpress.com', 'blogspot.com'
]

# Tags (matching your existing emailMonitor.js setup)
TAGS = [
    "Technology", "Charity", "Crypto", "Software", "Productivity", "Health", 
    "Social", "Sports", "Finance", "Business", "Retail", "Marketing", 
    "Education", "Entertainment", "Travel", "Lifestyle", "Fashion", "Beauty", 
    "Food", "Music", "Art", "Politics", "Social", "Ecommerce", "Mental Health", 
    "AI", "Other"
]

# Non-sponsor companies (matching your existing setup)
NON_SPONSOR_COMPANIES = [
    'openai', 'chatgpt', 'gpt', 'google', 'microsoft', 'facebook', 'twitter',
    'linkedin', 'instagram', 'youtube', 'tiktok', 'apple', 'amazon', 'meta',
    'anthropic', 'claude', 'gemini', 'bard', 'bing', 'github'
]

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'newsletter_scraper.log')
