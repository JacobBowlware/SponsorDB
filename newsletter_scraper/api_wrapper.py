#!/usr/bin/env python3
"""
API Wrapper for Newsletter Scraper
This script can be called from Node.js API routes
"""

import sys
import os
import json
import logging
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from newsletter_scraper import NewsletterScraper

# Configure logging for API calls
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def run_scraper():
    """Run the newsletter scraper once and return results"""
    try:
        logger.info("Starting newsletter scraper via API call")
        start_time = datetime.now()
        
        # Initialize scraper
        scraper = NewsletterScraper()
        
        # Run single scraping cycle
        scraper.run_scraping_cycle()
        
        # Get stats
        stats = scraper.db.get_stats()
        
        # Cleanup
        scraper.cleanup()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Return results
        result = {
            'success': True,
            'message': 'Newsletter scraper completed successfully',
            'duration_seconds': duration,
            'stats': stats,
            'timestamp': end_time.isoformat()
        }
        
        logger.info(f"Scraper completed in {duration:.2f} seconds")
        logger.info(f"Stats: {stats}")
        
        return result
        
    except Exception as e:
        logger.error(f"Newsletter scraper failed: {e}")
        return {
            'success': False,
            'message': f'Newsletter scraper failed: {str(e)}',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def main():
    """Main entry point for API calls"""
    try:
        result = run_scraper()
        
        # Output JSON result for Node.js to capture
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        logger.error(f"API wrapper failed: {e}")
        error_result = {
            'success': False,
            'message': f'API wrapper failed: {str(e)}',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
