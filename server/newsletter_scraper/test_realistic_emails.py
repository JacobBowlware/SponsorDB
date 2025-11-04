#!/usr/bin/env python3
"""
Test script with realistic newsletter email samples
Tests the complete scraping pipeline with various email formats
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from email_processor import EmailProcessor
from sponsor_analyzer import SponsorAnalyzer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Realistic test emails in the format your scraper receives them (plain text from HTML conversion)
TEST_EMAILS = [
    {
        'id': 'test_1',
        'subject': 'Morning Brew - Tech Roundup',
        'sender': 'crew@morningbrew.com',
        'body': '''
Good morning! Here's what you need to know today.

SPONSORED BY STRIPE

Stripe makes it easy to accept payments online. Whether you're building a SaaS product or running an ecommerce store, Stripe has the tools you need. 

Try Stripe for free and see why millions of businesses trust us with their payments.

Visit https://stripe.com/startups to get started with special pricing for startups.

---

In today's news:
- Tech stocks are up
- New AI model released
- Startup raises $50M

Read more at https://morningbrew.com/daily/stories/tech-news-today
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_2',
        'subject': 'TLDR Newsletter - Daily Tech News',
        'sender': 'dan@tldrnewsletter.com',
        'body': '''
TLDR - Too Long; Didn't Read

BROUGHT TO YOU BY NOTION

Notion is the connected workspace where better, faster work happens. Get started for free and organize your team's work in one place.

Sign up at https://notion.so/product?utm_source=tldr&utm_medium=newsletter with code TLDR2024 for 3 months free.

TODAY'S TECH NEWS:
Apple announces new products
Google updates search algorithm
Meta releases new VR headset

Subscribe to our premium tier at https://tldrnewsletter.com/subscribe
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_3',
        'subject': 'The Information - Tech Deep Dive',
        'sender': 'hello@theinformation.com',
        'body': '''
The Information

Today's top story: Google's AI strategy revealed

Read the full article: https://theinformation.com/articles/google-ai-strategy-2024

More stories:
- Startup funding slows
- Tech layoffs continue
- New regulations proposed

View in browser: https://theinformation.com/newsletters
Unsubscribe: https://theinformation.com/unsubscribe
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_4',
        'subject': 'Marketing Brew - Weekly Digest',
        'sender': 'crew@marketingbrew.com',
        'body': '''
Marketing Brew

SPONSORED CONTENT

HubSpot helps marketers grow better. From email marketing to CRM, HubSpot has everything you need to scale your business.

Get started free at https://hubspot.com/products/marketing?utm_source=marketingbrew

PARTNERED WITH MAILCHIMP

Mailchimp makes email marketing easy. Design beautiful campaigns, automate your workflows, and track your results.

Try Mailchimp today: https://mailchimp.com/pricing with discount code BREW20 for 20% off your first month.

THIS WEEK IN MARKETING:
Social media trends
Email best practices
SEO updates
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_5',
        'subject': 'Just Regular News - No Sponsors',
        'sender': 'news@regularnews.com',
        'body': '''
Regular News Daily

Top stories today:
- Weather update
- Local events
- Community news

Follow us on Twitter: https://twitter.com/regularnews
Like us on Facebook: https://facebook.com/regularnews
Visit our website: https://regularnews.com

Unsubscribe here: https://regularnews.com/unsubscribe
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_6',
        'subject': 'Indie Hackers Newsletter',
        'sender': 'csallen@indiehackers.com',
        'body': '''
Indie Hackers Newsletter

PRESENTED BY PADDLE

Paddle is the payment infrastructure for SaaS businesses. Handle subscriptions, billing, and taxes in one platform.

Get started with Paddle: https://paddle.com/signup?ref=indiehackers

THIS WEEK'S FOUNDER STORIES:
How I built a $10k/month SaaS
Growing without funding
Marketing strategies that work

SPONSOR THIS NEWSLETTER
Reach 50,000+ entrepreneurs: https://indiehackers.com/advertise
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_7',
        'subject': 'Hacker Newsletter',
        'sender': 'kale@hackernewsletter.com',
        'body': '''
Hacker Newsletter #600

Top links from Hacker News this week:

- New programming language released: https://example-lang.org
- Database performance tips: https://blog.databases.com/performance
- Startup acquisition news: https://techcrunch.com/startup-acquired

More at https://hackernewsletter.com/issues/600

---

Enjoying Hacker Newsletter? Consider sponsoring: https://hackernewsletter.com/sponsor
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_8',
        'subject': 'Software Lead Weekly',
        'sender': 'swlw@softwareleadweekly.com',
        'body': '''
Software Lead Weekly

SPONSORED BY LINEAR

Linear is the issue tracking tool that teams love. Built for speed and designed for modern software teams.

Try Linear free: https://linear.app?utm_source=swlw&utm_medium=email with code SWLW for your first 3 months free.

THIS WEEK'S ARTICLES:
Engineering management tips
Team productivity
Remote work strategies

ADVERTISEMENT

Datadog monitors your entire stack. Get real-time insights into your applications, infrastructure, and logs.

Start free trial: https://datadoghq.com/trial
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_9',
        'subject': 'Dense Discovery - Design Newsletter',
        'sender': 'kai@densediscovery.com',
        'body': '''
Dense Discovery Issue #250

PARTNER: WEBFLOW

Webflow empowers designers to build professional websites without code. From landing pages to complex sites, Webflow has you covered.

Get started free: https://webflow.com?utm_source=densediscovery

DESIGN INSPIRATION:
New portfolios we love
Color palette trends
Typography tips

Follow Dense Discovery: https://densediscovery.com/newsletter
Support on Patreon: https://patreon.com/densediscovery
        ''',
        'date': '2025-10-11'
    },
    
    {
        'id': 'test_10',
        'subject': 'Blog Post Digest - Weekly Articles',
        'sender': 'digest@blogpost.com',
        'body': '''
Blog Post Digest

This week's most popular blog posts:

"10 Tips for Better Writing" - https://writingblog.com/10-tips
Read the full article and learn how to improve your writing skills today.

"Marketing Strategies Explained" - https://marketingtoday.com/strategies
Continue reading about effective marketing techniques.

"Tech News Roundup" - https://technews.com/roundup
Full story available on our website.

More articles: https://blogpost.com/archive
Subscribe to premium: https://blogpost.com/premium
        ''',
        'date': '2025-10-11'
    }
]

def test_email_processing():
    """Test email processing with realistic samples"""
    email_processor = EmailProcessor()
    sponsor_analyzer = SponsorAnalyzer()
    
    results = []
    
    for i, test_email in enumerate(TEST_EMAILS, 1):
        logger.info(f"\n{'='*60}")
        logger.info(f"TEST {i}/{len(TEST_EMAILS)}: {test_email['subject']}")
        logger.info(f"{'='*60}")
        
        # Check sponsor indicators
        has_indicators = email_processor.has_sponsor_indicators(test_email)
        logger.info(f"Has sponsor indicators: {has_indicators}")
        
        if not has_indicators:
            results.append({
                'email': test_email['subject'],
                'has_indicators': False,
                'sponsors_found': 0
            })
            continue
        
        # Extract sponsor sections
        sponsor_sections = email_processor.process_sponsor_sections_with_confidence(test_email)
        logger.info(f"Found {len(sponsor_sections)} sponsor sections")
        
        # Analyze each section
        total_sponsors = 0
        for section in sponsor_sections:
            if section.get('processing_status') == 'rejected':
                continue
                
            newsletter_name = test_email['sender']
            sponsors = sponsor_analyzer.analyze_sponsor_section(section, newsletter_name)
            
            for sponsor in sponsors:
                logger.info(f"✅ FOUND SPONSOR: {sponsor.get('sponsorName')} - {sponsor.get('rootDomain')}")
                logger.info(f"   Contact: {sponsor.get('contactMethod')} - Email: {sponsor.get('sponsorEmail')}, App: {sponsor.get('sponsorApplication')}")
                total_sponsors += 1
        
        results.append({
            'email': test_email['subject'],
            'has_indicators': True,
            'sections_found': len(sponsor_sections),
            'sponsors_found': total_sponsors
        })
    
    # Print summary
    logger.info(f"\n{'='*60}")
    logger.info("TEST SUMMARY")
    logger.info(f"{'='*60}")
    
    for result in results:
        logger.info(f"\n{result['email']}")
        logger.info(f"  Has indicators: {result['has_indicators']}")
        if result['has_indicators']:
            logger.info(f"  Sections found: {result.get('sections_found', 0)}")
            logger.info(f"  Sponsors found: {result.get('sponsors_found', 0)}")
    
    total_sponsors = sum(r.get('sponsors_found', 0) for r in results)
    logger.info(f"\nTOTAL SPONSORS FOUND: {total_sponsors}")
    
    return results

if __name__ == "__main__":
    try:
        results = test_email_processing()
        sys.exit(0)
    except Exception as e:
        logger.error(f"Test failed: {e}")
        sys.exit(1)











