#!/usr/bin/env python3
"""
Test script for the newsletter scraper
"""

import logging
import sys
import os
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SponsorDatabase
from email_processor import EmailProcessor
from sponsor_analyzer import SponsorAnalyzer
from config import LOG_LEVEL

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def test_database_connection():
    """Test MongoDB connection"""
    logger.info("Testing database connection...")
    try:
        db = SponsorDatabase()
        stats = db.get_stats()
        logger.info(f"Database connection successful. Stats: {stats}")
        db.close()
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

def test_email_connection():
    """Test email connection"""
    logger.info("Testing email connection...")
    try:
        email_processor = EmailProcessor()
        # Try to get recent emails (limit to 1 for testing)
        emails = email_processor.get_recent_emails(limit=1)
        logger.info(f"Email connection successful. Found {len(emails)} emails")
        email_processor.disconnect()
        return True
    except Exception as e:
        logger.error(f"Email connection failed: {e}")
        return False

def test_sponsor_analyzer():
    """Test sponsor analyzer with sample data"""
    logger.info("Testing sponsor analyzer...")
    try:
        analyzer = SponsorAnalyzer()
        
        # Test with sample sponsor section
        sample_section = {
            'section_text': 'SPONSORED BY: Check out our amazing product at https://example.com for the best deals!',
            'links': ['https://example.com'],
            'sponsor_evidence': 'SPONSORED BY: Check out our amazing product'
        }
        
        sponsors = analyzer.analyze_sponsor_section(sample_section, 'Test Newsletter')
        logger.info(f"Sponsor analyzer test completed. Found {len(sponsors)} sponsors")
        return True
    except Exception as e:
        logger.error(f"Sponsor analyzer test failed: {e}")
        return False

def test_full_workflow():
    """Test the complete workflow"""
    logger.info("Testing full workflow...")
    try:
        from newsletter_scraper import NewsletterScraper
        scraper = NewsletterScraper()
        
        # Run a single cycle
        scraper.run_scraping_cycle()
        
        # Get stats
        stats = scraper.db.get_stats()
        logger.info(f"Full workflow test completed. Database stats: {stats}")
        
        scraper.cleanup()
        return True
    except Exception as e:
        logger.error(f"Full workflow test failed: {e}")
        return False

def main():
    """Run all tests"""
    logger.info("Starting newsletter scraper tests...")
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Email Connection", test_email_connection),
        ("Sponsor Analyzer", test_sponsor_analyzer),
        ("Full Workflow", test_full_workflow)
    ]
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"\n{'='*50}")
        logger.info(f"Running: {test_name}")
        logger.info(f"{'='*50}")
        
        try:
            result = test_func()
            results.append((test_name, result))
            if result:
                logger.info(f"✅ {test_name} PASSED")
            else:
                logger.error(f"❌ {test_name} FAILED")
        except Exception as e:
            logger.error(f"❌ {test_name} FAILED with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    logger.info(f"\n{'='*50}")
    logger.info("TEST SUMMARY")
    logger.info(f"{'='*50}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed!")
        return 0
    else:
        logger.error("💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
