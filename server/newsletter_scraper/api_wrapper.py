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

# Configure logging for API calls - send to stderr to avoid interfering with JSON output
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

logger = logging.getLogger(__name__)

def run_scraper():
    """Run the newsletter scraper once and return results"""
    try:
        logger.info("=== Starting newsletter scraper via API call ===")
        start_time = datetime.now()
        
        # Initialize scraper
        logger.info("Initializing NewsletterScraper...")
        scraper = NewsletterScraper()
        logger.info("NewsletterScraper initialized successfully")
        
        # Run single scraping cycle with email limit
        logger.info("Starting scraping cycle with max_emails=20...")
        scraper.run_scraping_cycle(max_emails=20)
        logger.info("Scraping cycle completed successfully")
        
        # Get stats
        logger.info("Getting database stats...")
        stats = scraper.db.get_stats()
        logger.info(f"Database stats retrieved: {stats}")
        
        # Cleanup
        logger.info("Cleaning up scraper resources...")
        scraper.cleanup()
        logger.info("Cleanup completed")
        
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
        logger.info(f"Final stats: {stats}")
        
        return result
        
    except Exception as e:
        logger.error(f"Newsletter scraper failed: {e}", exc_info=True)
        return {
            'success': False,
            'message': f'Newsletter scraper failed: {str(e)}',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def main():
    """Main entry point for API calls"""
    try:
        logger.info("=== API Wrapper Main Entry Point ===")
        result = run_scraper()
        
        logger.info(f"Scraper result: {result['success']}")
        
        # Output JSON result for Node.js to capture
        logger.info("Outputting JSON result to stdout...")
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        exit_code = 0 if result['success'] else 1
        logger.info(f"Exiting with code: {exit_code}")
        sys.exit(exit_code)
        
    except Exception as e:
        logger.error(f"API wrapper failed: {e}", exc_info=True)
        error_result = {
            'success': False,
            'message': f'API wrapper failed: {str(e)}',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
        logger.error("Outputting error JSON result to stdout...")
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
