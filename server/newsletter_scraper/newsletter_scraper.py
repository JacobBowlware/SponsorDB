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
        
        # Log OpenAI status
        if self.sponsor_analyzer.openai_client:
            logger.info("OpenAI client initialized - GPT analysis enabled")
        else:
            logger.warning("OpenAI client not available - GPT analysis disabled")
        
    def run_scraping_cycle(self, max_emails=10):
        """Run a single scraping cycle with email limit to prevent timeouts"""
        logger.info(f"Starting newsletter scraping cycle (max_emails={max_emails})")
        start_time = time.time()
        total_sponsors = 0
        processed_emails = 0
        new_pending_sponsors = 0  # Track newly added sponsors that need review
        
        # Track rejection reasons
        rejection_stats = {
            'emails_without_sponsor_indicators': 0,
            'emails_without_sponsor_sections': 0,
            'sections_rejected_low_confidence': 0,
            'domains_denied': 0,
            'self_reference_skipped': 0,
            'already_exists': 0,
            'enriched_existing': 0,
            'no_contact_method': 0,
            'no_subscriber_estimate': 0,
            'save_failed': 0,
            'email_processing_errors': 0,
            'total_sponsors_analyzed': 0,
            'total_sections_found': 0
        }
        
        try:
            # Get recent emails with limit
            emails = self.email_processor.get_recent_emails(limit=max_emails)
            logger.info(f"Found {len(emails)} emails to process")
            
            for email_data in emails:
                try:
                    # Check if email has sponsor indicators
                    if not self.email_processor.has_sponsor_indicators(email_data):
                        rejection_stats['emails_without_sponsor_indicators'] += 1
                        continue
                    
                    # Extract newsletter name
                    newsletter_name = self.email_processor.get_newsletter_name(email_data)
                    
                    # Extract sponsor sections with confidence scoring
                    sponsor_sections = self.email_processor.process_sponsor_sections_with_confidence(email_data)
                    
                    if not sponsor_sections:
                        rejection_stats['emails_without_sponsor_sections'] += 1
                        continue
                    
                    rejection_stats['total_sections_found'] += len(sponsor_sections)
                    
                    # Process each sponsor section (filter by confidence and status)
                    for section in sponsor_sections:
                        # Skip rejected sections
                        if section.get('processing_status') == 'rejected':
                            rejection_stats['sections_rejected_low_confidence'] += 1
                            continue
                        
                        # Get confidence and status (but don't log every section)
                        confidence = section.get('confidence_score', 0)
                        status = section.get('processing_status', 'unknown')
                        
                        sponsors = self.sponsor_analyzer.analyze_sponsor_section(
                            section, newsletter_name
                        )
                        
                        for sponsor in sponsors:
                            rejection_stats['total_sponsors_analyzed'] += 1
                            
                            # 1. VALIDATION: Check if domain is denied
                            if self.db.is_domain_denied(sponsor['rootDomain']):
                                rejection_stats['domains_denied'] += 1
                                continue
                            
                            # 2. VALIDATION: Check for self-reference (newsletter advertising itself)
                            newsletter_domain = self.sponsor_analyzer._extract_newsletter_domain(newsletter_name)
                            if newsletter_domain and sponsor['rootDomain'].lower() == newsletter_domain.lower():
                                rejection_stats['self_reference_skipped'] += 1
                                continue
                            
                            # 3. VALIDATION: Check if sponsor already exists
                            existing = self.db.get_sponsor_by_domain(sponsor['rootDomain'])
                            if existing:
                                # If existing sponsor has no contact info, try to enrich it
                                if existing.get('contactMethod') == 'none' and sponsor.get('contactMethod') != 'none':
                                    try:
                                        # Update existing record with new contact info
                                        update_data = {
                                            'sponsorEmail': sponsor.get('sponsorEmail'),
                                            'sponsorApplication': sponsor.get('sponsorApplication'),
                                            'contactMethod': sponsor.get('contactMethod'),
                                            'lastAnalyzed': datetime.utcnow()
                                        }
                                        self.db.update_sponsor(str(existing['_id']), update_data)
                                        rejection_stats['enriched_existing'] += 1
                                    except Exception as e:
                                        logger.error(f"Failed to enrich sponsor {sponsor.get('sponsorName')}: {e}")
                                        rejection_stats['save_failed'] += 1
                                else:
                                    rejection_stats['already_exists'] += 1
                                continue
                            
                            # 4. VALIDATION: Mandatory contact info requirement - RELAXED
                            # CHANGED: Allow sponsors without contact info to be saved as pending
                            # If they passed legitimacy checks, they're likely sponsors - save them for manual review
                            # No longer rejecting here - let them be saved with pending status
                            if not sponsor.get('sponsorEmail') and not sponsor.get('sponsorApplication'):
                                logger.info(f"⚠️ No contact info for {sponsor.get('sponsorName')}, but saving as pending for manual review")
                                # Don't increment rejection_stats - this is intentional, not a rejection
                            
                            # 6. VALIDATION: Must have estimated subscribers
                            if not sponsor.get('estimatedSubscribers') or sponsor.get('estimatedSubscribers', 0) <= 0:
                                rejection_stats['no_subscriber_estimate'] += 1
                                continue
                            
                            # Add confidence and processing status from section
                            sponsor['confidence'] = confidence
                            sponsor['processing_status'] = status
                            
                            # Set analysis status based on contact info
                            if sponsor.get('sponsorEmail') and sponsor.get('sponsorApplication'):
                                sponsor['analysisStatus'] = 'complete'
                                sponsor['confidence'] = max(sponsor.get('confidence', 0), 0.9)
                            elif sponsor.get('sponsorEmail'):
                                sponsor['analysisStatus'] = 'complete'
                                sponsor['confidence'] = max(sponsor.get('confidence', 0), 0.8)
                            elif sponsor.get('sponsorApplication'):
                                sponsor['analysisStatus'] = 'complete'
                                sponsor['confidence'] = max(sponsor.get('confidence', 0), 0.7)
                            
                            # Optional: Use GPT for final analysis
                            if self.sponsor_analyzer.openai_client:
                                sponsor = self.sponsor_analyzer.gpt_analyze_sponsor(sponsor)
                            
                            # Save to database
                            try:
                                sponsor_id = self.db.create_sponsor(sponsor)
                                total_sponsors += 1
                                
                                # Track if this new sponsor needs review (pending status)
                                if sponsor.get('analysisStatus') == 'pending':
                                    new_pending_sponsors += 1
                                    
                            except Exception as e:
                                logger.error(f"Failed to save sponsor {sponsor.get('sponsorName', 'Unknown')}: {e}")
                                rejection_stats['save_failed'] += 1
                                continue
                    
                    # Mark email as read
                    self.email_processor.mark_email_as_read(email_data['id'])
                    processed_emails += 1
                    
                except Exception as e:
                    logger.error(f"Failed to process email {email_data.get('id', 'unknown')}: {e}")
                    rejection_stats['email_processing_errors'] += 1
                    continue
            
            # Log comprehensive summary with rejection stats
            duration = time.time() - start_time
            logger.info("")
            logger.info("=" * 70)
            logger.info("📊 SPONSOR SCRAPER COMPLETE")
            logger.info("=" * 70)
            logger.info("")
            logger.info("✅ RESULTS:")
            logger.info(f"   • Emails Processed: {processed_emails}")
            logger.info(f"   • New Sponsors Added: {total_sponsors}")
            logger.info(f"   • Need Review (Pending): {new_pending_sponsors}")
            logger.info(f"   • Complete (Ready): {total_sponsors - new_pending_sponsors}")
            logger.info("")
            logger.info("📈 ANALYSIS STATS:")
            logger.info(f"   • Total Sponsor Sections Found: {rejection_stats['total_sections_found']}")
            logger.info(f"   • Total Sponsors Analyzed: {rejection_stats['total_sponsors_analyzed']}")
            logger.info(f"   • Existing Sponsors Enriched: {rejection_stats['enriched_existing']}")
            logger.info("")
            logger.info("❌ REJECTION SUMMARY:")
            
            # Log rejections in order of frequency (most common first)
            rejections_ordered = [
                ('emails_without_sponsor_indicators', 'Emails without sponsor indicators'),
                ('emails_without_sponsor_sections', 'Emails with no sponsor sections extracted'),
                ('sections_rejected_low_confidence', 'Sections rejected due to low confidence'),
                ('already_exists', 'Sponsors already exist in database'),
                # Removed: no_contact_method - we now save sponsors without contact as pending
                ('no_subscriber_estimate', 'Rejected: No subscriber estimate'),
                ('domains_denied', 'Rejected: Domain is blacklisted'),
                ('self_reference_skipped', 'Skipped: Self-reference (newsletter advertising itself)'),
                ('save_failed', 'Failed to save to database'),
                ('email_processing_errors', 'Email processing errors')
            ]
            
            total_rejected = 0
            for key, description in rejections_ordered:
                count = rejection_stats.get(key, 0)
                if count > 0:
                    logger.info(f"   • {description}: {count}")
                    total_rejected += count
            
            logger.info("")
            logger.info(f"⏱️  Duration: {duration:.1f}s")
            logger.info("=" * 70)
            logger.info("")
            
            # Return summary for API wrapper
            return {
                'new_sponsors_added': total_sponsors,
                'need_review': new_pending_sponsors,
                'complete': total_sponsors - new_pending_sponsors,
                'emails_processed': processed_emails,
                'duration_seconds': duration,
                'rejection_stats': rejection_stats
            }
            
        except Exception as e:
            logger.error(f"Scraping cycle failed: {e}")
            # Return error summary instead of raising
            return {
                'new_sponsors_added': 0,
                'need_review': 0,
                'complete': 0,
                'emails_processed': processed_emails,
                'duration_seconds': time.time() - start_time,
                'error': str(e),
                'rejection_stats': rejection_stats if 'rejection_stats' in locals() else {}
            }
    
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
        
        # Schedule every 30 minutes scraping
        self.scheduler.add_job(
            func=self.run_scraping_cycle,
            trigger=IntervalTrigger(minutes=30),
            id='half_hourly_scraping',
            name='Half-Hourly Newsletter Scraping',
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
