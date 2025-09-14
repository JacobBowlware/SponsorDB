import logging
import time
from datetime import datetime
from typing import List, Dict
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from database import SponsorDatabase
from email_processor import EmailProcessor
from sponsor_analyzer import SponsorAnalyzer
from config import LOG_LEVEL, LOG_FILE

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class NewsletterScraper:
    def __init__(self):
        self.db = SponsorDatabase()
        self.email_processor = EmailProcessor()
        self.sponsor_analyzer = SponsorAnalyzer()
        self.scheduler = BlockingScheduler()
        
    def run_scraping_cycle(self):
        """Run a single scraping cycle"""
        logger.info("Starting newsletter scraping cycle")
        start_time = time.time()
        
        try:
            # Get recent emails
            emails = self.email_processor.get_recent_emails()
            logger.info(f"Processing {len(emails)} emails")
            
            total_sponsors = 0
            processed_emails = 0
            
            for email_data in emails:
                try:
                    # Check if email has sponsor indicators
                    if not self.email_processor.has_sponsor_indicators(email_data):
                        continue
                    
                    # Extract newsletter name
                    newsletter_name = self.email_processor.get_newsletter_name(email_data)
                    
                    # Extract sponsor sections
                    sponsor_sections = self.email_processor.extract_sponsor_sections(email_data)
                    
                    if not sponsor_sections:
                        continue
                    
                    # Process each sponsor section
                    for section in sponsor_sections:
                        sponsors = self.sponsor_analyzer.analyze_sponsor_section(
                            section, newsletter_name
                        )
                        
                        for sponsor in sponsors:
                            # Check if sponsor already exists
                            existing = self.db.get_sponsor_by_domain(sponsor['rootDomain'])
                            if existing:
                                logger.debug(f"Sponsor already exists: {sponsor['rootDomain']}")
                                continue
                            
                            # Optional: Use GPT for final analysis
                            if self.sponsor_analyzer.openai_client:
                                sponsor = self.sponsor_analyzer.gpt_analyze_sponsor(sponsor)
                            
                            # Save to database
                            sponsor_id = self.db.create_sponsor(sponsor)
                            total_sponsors += 1
                            logger.info(f"Saved sponsor: {sponsor['sponsorName']} (ID: {sponsor_id})")
                    
                    # Mark email as read
                    self.email_processor.mark_email_as_read(email_data['id'])
                    processed_emails += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process email {email_data.get('id', 'unknown')}: {e}")
                    continue
            
            # Log results
            duration = time.time() - start_time
            logger.info(f"Scraping cycle completed: {total_sponsors} sponsors found, "
                       f"{processed_emails} emails processed in {duration:.2f}s")
            
            # Print database stats
            stats = self.db.get_stats()
            logger.info(f"Database stats: {stats}")
            
        except Exception as e:
            logger.error(f"Scraping cycle failed: {e}")
            raise
    
    def run_manual_analysis(self):
        """Run analysis on pending sponsors"""
        logger.info("Starting manual analysis of pending sponsors")
        
        pending_sponsors = self.db.get_pending_sponsors()
        logger.info(f"Found {len(pending_sponsors)} pending sponsors")
        
        for sponsor in pending_sponsors:
            try:
                # Re-analyze with current logic
                updated_sponsor = self.sponsor_analyzer.gpt_analyze_sponsor(sponsor)
                
                # Update in database
                self.db.update_sponsor(str(sponsor['_id']), updated_sponsor)
                logger.info(f"Updated sponsor: {sponsor.get('sponsorName', 'Unknown')}")
                
            except Exception as e:
                logger.error(f"Failed to analyze sponsor {sponsor.get('_id')}: {e}")
                continue
    
    def start_scheduler(self):
        """Start the scheduled scraper"""
        logger.info("Starting newsletter scraper scheduler")
        
        # Schedule hourly scraping
        self.scheduler.add_job(
            func=self.run_scraping_cycle,
            trigger=IntervalTrigger(hours=1),
            id='hourly_scraping',
            name='Hourly Newsletter Scraping',
            replace_existing=True
        )
        
        # Schedule daily manual analysis
        self.scheduler.add_job(
            func=self.run_manual_analysis,
            trigger=CronTrigger(hour=2, minute=0),  # 2 AM daily
            id='daily_analysis',
            name='Daily Manual Analysis',
            replace_existing=True
        )
        
        # Schedule weekly stats report
        self.scheduler.add_job(
            func=self.print_weekly_stats,
            trigger=CronTrigger(day_of_week=0, hour=9, minute=0),  # Sunday 9 AM
            id='weekly_stats',
            name='Weekly Stats Report',
            replace_existing=True
        )
        
        try:
            self.scheduler.start()
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
        except Exception as e:
            logger.error(f"Scheduler failed: {e}")
            raise
    
    def print_weekly_stats(self):
        """Print weekly statistics"""
        stats = self.db.get_stats()
        logger.info("=== WEEKLY STATS ===")
        logger.info(f"Total sponsors: {stats.get('total_sponsors', 0)}")
        logger.info(f"Complete: {stats.get('complete', 0)}")
        logger.info(f"Pending: {stats.get('pending', 0)}")
        logger.info(f"Manual review required: {stats.get('manual_review_required', 0)}")
        logger.info("===================")
    
    def run_once(self):
        """Run scraper once (for testing)"""
        logger.info("Running scraper once")
        try:
            self.run_scraping_cycle()
            self.run_manual_analysis()
        except Exception as e:
            logger.error(f"Single run failed: {e}")
            raise
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        try:
            self.email_processor.disconnect()
            self.db.close()
            logger.info("Cleanup completed")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")

def main():
    """Main entry point"""
    scraper = NewsletterScraper()
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--once':
        # Run once for testing
        scraper.run_once()
    else:
        # Start scheduler
        scraper.start_scheduler()

if __name__ == "__main__":
    main()
