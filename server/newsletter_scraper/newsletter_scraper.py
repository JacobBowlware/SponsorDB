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
        
        # Verify Gemini is available (required)
        if not self.sponsor_analyzer.gemini_model:
            error_msg = "❌ CRITICAL: Gemini model is not available. Scraper requires Gemini to function."
            logger.error(error_msg)
            raise RuntimeError(error_msg)
        
        logger.info("✅ Gemini model initialized - Scraper ready to run")
        
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
        
        # Track contact quality metrics
        contact_quality_stats = {
            'named_person_found': 0,      # HIGH VALUE
            'business_email_found': 0,     # MEDIUM VALUE
            'generic_email_found': 0,     # LOW VALUE
            'no_contact_found': 0,        # FAILED
            'total_sponsors_processed': 0
        }
        
        try:
            # Get recent emails with limit
            emails = self.email_processor.get_recent_emails(limit=max_emails)
            logger.info(f"Found {len(emails)} emails to process")
            
            # Cache subscriber counts per newsletter to avoid repeated DB queries
            newsletter_subscriber_cache = {}
            
            for email_data in emails:
                try:
                    # Check if email has sponsor indicators
                    if not self.email_processor.has_sponsor_indicators(email_data):
                        rejection_stats['emails_without_sponsor_indicators'] += 1
                        continue
                    
                    # Extract newsletter name
                    newsletter_name = self.email_processor.get_newsletter_name(email_data)
                    
                    # Cache subscriber count for this newsletter (query DB once per newsletter)
                    if newsletter_name and newsletter_name not in newsletter_subscriber_cache:
                        cached_count = self.db.get_max_subscriber_count_for_newsletter(newsletter_name)
                        newsletter_subscriber_cache[newsletter_name] = cached_count
                        if cached_count > 0:
                            logger.info(f"📊 Cached subscriber count for '{newsletter_name}': {cached_count:,}")
                    
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
                        
                        # Pass cached subscriber count to analyzer
                        cached_subscriber_count = newsletter_subscriber_cache.get(newsletter_name, 0)
                        
                        sponsors = self.sponsor_analyzer.analyze_sponsor_section(
                            section, newsletter_name, cached_subscriber_count
                        )
                        
                        for sponsor in sponsors:
                            rejection_stats['total_sponsors_analyzed'] += 1
                            sponsor_name = sponsor.get('sponsorName', 'Unknown')
                            sponsor_domain = sponsor.get('rootDomain', 'Unknown')
                            
                            logger.info(f"🔍 Processing sponsor: {sponsor_name} ({sponsor_domain})")
                            
                            # 1. VALIDATION: Check if domain is denied
                            if self.db.is_domain_denied(sponsor['rootDomain']):
                                logger.info(f"❌ REJECTED: Domain denied - {sponsor_domain}")
                                rejection_stats['domains_denied'] += 1
                                continue
                            
                            # 2. VALIDATION: Check for self-reference (newsletter advertising itself)
                            newsletter_domain = self.sponsor_analyzer._extract_newsletter_domain(newsletter_name)
                            if newsletter_domain and sponsor['rootDomain'].lower() == newsletter_domain.lower():
                                logger.info(f"❌ REJECTED: Self-reference - {sponsor_domain}")
                                rejection_stats['self_reference_skipped'] += 1
                                continue
                            
                            # 3. VALIDATION: Check if sponsor already exists
                            existing = self.db.get_sponsor_by_domain(sponsor['rootDomain'])
                            if existing:
                                logger.info(f"ℹ️ Sponsor already exists: {sponsor_domain} (ID: {existing.get('_id', 'N/A')})")
                                # If existing sponsor has no contact info, try to enrich it
                                if existing.get('contactMethod') == 'none' and sponsor.get('contactMethod') != 'none':
                                    try:
                                        logger.info(f"💎 Enriching existing sponsor with contact info: {sponsor.get('sponsorEmail')}")
                                        # Update existing record with new contact info
                                        update_data = {
                                            'sponsorEmail': sponsor.get('sponsorEmail'),
                                            'contactMethod': sponsor.get('contactMethod'),
                                            'contactPersonName': sponsor.get('contactPersonName'),
                                            'contactPersonTitle': sponsor.get('contactPersonTitle'),
                                            'contactType': sponsor.get('contactType'),
                                            'confidence': sponsor.get('confidence'),
                                            'lastAnalyzed': datetime.utcnow()
                                        }
                                        self.db.update_sponsor(str(existing['_id']), update_data)
                                        rejection_stats['enriched_existing'] += 1
                                        logger.info(f"✅ Successfully enriched sponsor: {sponsor_name}")
                                    except Exception as e:
                                        logger.error(f"❌ Failed to enrich sponsor {sponsor_name}: {e}")
                                        rejection_stats['save_failed'] += 1
                                else:
                                    logger.info(f"ℹ️ Sponsor already exists with contact info - skipping")
                                    rejection_stats['already_exists'] += 1
                                continue
                            
                            # 4. VALIDATION: Mandatory contact info requirement - RELAXED
                            # CHANGED: Allow sponsors without contact info to be saved as pending
                            # If they passed legitimacy checks, they're likely sponsors - save them for manual review
                            # No longer rejecting here - let them be saved with pending status
                            if not sponsor.get('sponsorEmail'):
                                logger.info(f"⚠️ No contact info for {sponsor_name}, but saving as pending for manual review")
                                # Don't increment rejection_stats - this is intentional, not a rejection
                            
                            # 6. VALIDATION: Subscriber estimate - if missing, mark as pending but still save
                            estimated_subs = sponsor.get('estimatedSubscribers', 0)
                            if not estimated_subs or estimated_subs <= 0:
                                logger.info(f"⚠️ No subscriber estimate for {sponsor_name} (estimated: {estimated_subs}) - marking as pending")
                                sponsor['estimatedSubscribers'] = 0  # Set to 0 so it doesn't cause issues
                                sponsor['analysisStatus'] = 'pending'  # Mark for manual review
                                # Don't reject - save as pending for manual review
                            
                            logger.info(f"✅ Sponsor passed all validations: {sponsor_name}")
                            
                            # Add confidence and processing status from section
                            sponsor['confidence'] = confidence
                            sponsor['processing_status'] = status
                            
                            # Set analysis status based on contact info (email only now)
                            if sponsor.get('sponsorEmail'):
                                sponsor['analysisStatus'] = 'complete'
                                sponsor['confidence'] = max(sponsor.get('confidence', 0), 0.8)
                            else:
                                sponsor['analysisStatus'] = 'pending'
                                sponsor['confidence'] = max(sponsor.get('confidence', 0), 0.5)
                            
                            # Optional: Use Gemini for final analysis (sponsor data enhancement)
                            # Note: Email finding already happens in _scrape_website_info (Gemini first, then web scraping)
                            if self.sponsor_analyzer.gemini_model:
                                sponsor = self.sponsor_analyzer.gemini_analyze_sponsor(sponsor)
                            
                            # Track contact quality metrics
                            contact_quality_stats['total_sponsors_processed'] += 1
                            contact_type = sponsor.get('contactType', 'not_found')
                            if contact_type == 'named_person':
                                contact_quality_stats['named_person_found'] += 1
                            elif contact_type == 'business_email':
                                contact_quality_stats['business_email_found'] += 1
                            elif contact_type == 'generic_email':
                                contact_quality_stats['generic_email_found'] += 1
                            elif not sponsor.get('sponsorEmail'):
                                contact_quality_stats['no_contact_found'] += 1
                            
                            # Save to database - route to affiliates or sponsors collection
                            try:
                                logger.info(f"💾 Attempting to save sponsor: {sponsor_name} to database...")
                                # Check if this is an affiliate program
                                if sponsor.get('isAffiliateProgram'):
                                    logger.info(f"📦 Detected affiliate program: {sponsor_name}")
                                    # Convert to affiliate format
                                    affiliate_data = {
                                        'affiliateName': sponsor['sponsorName'],
                                        'affiliateLink': sponsor['sponsorLink'],
                                        'rootDomain': sponsor['rootDomain'],
                                        'tags': sponsor.get('tags', []),
                                        'affiliatedNewsletters': [{
                                            'newsletterName': newsletter_name,
                                            'estimatedAudience': sponsor.get('estimatedSubscribers', 0),
                                            'contentTags': sponsor.get('tags', []),
                                            'dateAffiliated': datetime.utcnow(),
                                            'emailAddress': sponsor.get('sponsorEmail', '')
                                        }],
                                        'commissionInfo': sponsor.get('affiliateSignupLink', ''),
                                        'status': 'pending'
                                    }
                                    # Save to affiliates collection
                                    affiliate_id = self.db.create_affiliate(affiliate_data)
                                    logger.info(f"✅ Saved affiliate program: {sponsor_name} (ID: {affiliate_id})")
                                    total_sponsors += 1
                                    
                                    # Track if this new affiliate needs review (pending status)
                                    if affiliate_data.get('status') == 'pending':
                                        new_pending_sponsors += 1
                                else:
                                    # Save to sponsors collection (existing logic)
                                    logger.info(f"💾 Saving sponsor to database: {sponsor_name} (domain: {sponsor_domain})")
                                    logger.info(f"   Contact: {sponsor.get('sponsorEmail', 'None')}")
                                    logger.info(f"   Contact Type: {sponsor.get('contactType', 'None')}")
                                    logger.info(f"   Estimated Subs: {sponsor.get('estimatedSubscribers', 0)}")
                                    sponsor_id = self.db.create_sponsor(sponsor)
                                    logger.info(f"✅ Successfully saved sponsor: {sponsor_name} (ID: {sponsor_id})")
                                    total_sponsors += 1
                                    
                                    # Track if this new sponsor needs review (pending status)
                                    if sponsor.get('analysisStatus') == 'pending':
                                        new_pending_sponsors += 1
                                    
                            except Exception as e:
                                logger.error(f"❌ Failed to save sponsor/affiliate {sponsor_name}: {e}")
                                logger.error(f"   Error type: {type(e).__name__}")
                                logger.error(f"   Sponsor data keys: {list(sponsor.keys())}")
                                import traceback
                                logger.error(f"   Traceback: {traceback.format_exc()}")
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
                # Removed: no_subscriber_estimate - we now save sponsors without subscriber estimate as pending
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
            logger.info("💎 CONTACT QUALITY METRICS:")
            total_contacts = contact_quality_stats['total_sponsors_processed']
            if total_contacts > 0:
                named_pct = (contact_quality_stats['named_person_found'] / total_contacts) * 100
                business_pct = (contact_quality_stats['business_email_found'] / total_contacts) * 100
                generic_pct = (contact_quality_stats['generic_email_found'] / total_contacts) * 100
                no_contact_pct = (contact_quality_stats['no_contact_found'] / total_contacts) * 100
                
                logger.info(f"   • 💎 Named Person Contacts: {contact_quality_stats['named_person_found']}/{total_contacts} ({named_pct:.1f}%) - HIGH VALUE")
                logger.info(f"   • 📧 Business Email Contacts: {contact_quality_stats['business_email_found']}/{total_contacts} ({business_pct:.1f}%) - MEDIUM VALUE")
                logger.info(f"   • 📮 Generic Email Contacts: {contact_quality_stats['generic_email_found']}/{total_contacts} ({generic_pct:.1f}%) - LOW VALUE")
                logger.info(f"   • ❌ No Contact Found: {contact_quality_stats['no_contact_found']}/{total_contacts} ({no_contact_pct:.1f}%) - FAILED")
                
                if named_pct >= 60:
                    logger.info(f"   ✅ EXCELLENT: {named_pct:.1f}% named contacts - Major competitive advantage!")
                elif named_pct >= 40:
                    logger.info(f"   ✅ GOOD: {named_pct:.1f}% named contacts - Above average")
                elif named_pct >= 20:
                    logger.info(f"   ⚠️  FAIR: {named_pct:.1f}% named contacts - Room for improvement")
                else:
                    logger.info(f"   ⚠️  LOW: {named_pct:.1f}% named contacts - Consider prompt refinement")
            else:
                logger.info("   • No sponsors processed in this cycle")
            
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
                'rejection_stats': rejection_stats,
                'contact_quality_stats': contact_quality_stats
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
                # Re-analyze with Gemini (includes email finding in STEP 1)
                if self.sponsor_analyzer.gemini_model:
                    updated_sponsor = self.sponsor_analyzer.gemini_analyze_sponsor(sponsor)
                else:
                    updated_sponsor = sponsor
                
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
