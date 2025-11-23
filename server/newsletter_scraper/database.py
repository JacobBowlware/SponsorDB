import logging
from datetime import datetime
from typing import Dict, List, Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from config import MONGODB_URI, DATABASE_NAME, COLLECTION_NAME

logger = logging.getLogger(__name__)

class SponsorDatabase:
    def __init__(self):
        self.client: MongoClient = None
        self.db: Database = None
        self.collection: Collection = None
        self.denied_domains_collection: Collection = None
        self.connect()
    
    def connect(self):
        """Establish MongoDB connection"""
        try:
            self.client = MongoClient(MONGODB_URI)
            self.db = self.client[DATABASE_NAME]
            self.collection = self.db[COLLECTION_NAME]
            self.denied_domains_collection = self.db['denieddomains']
            
            # Test connection
            self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {DATABASE_NAME}.{COLLECTION_NAME}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def create_sponsor(self, sponsor_data: Dict) -> str:
        """Create a new sponsor record or update existing one with newsletter info"""
        try:
            root_domain = sponsor_data.get('rootDomain', '')
            newsletter_name = sponsor_data.get('newsletterSponsored') or sponsor_data.get('sourceNewsletter', '')
            
            if not root_domain:
                logger.warning("No rootDomain provided, cannot create/update sponsor")
                raise ValueError("rootDomain is required")
            
            # Check if sponsor with same rootDomain already exists
            existing_sponsor = self.collection.find_one({'rootDomain': root_domain})
            
            if existing_sponsor:
                # Update existing sponsor: append newsletter to newslettersSponsored array
                logger.info(f"Sponsor with domain {root_domain} exists, appending newsletter info")
                
                # Prepare newsletter entry
                # Use tags from sponsor_data, which should be the contentTags for this newsletter
                newsletter_entry = {
                    'newsletterName': newsletter_name,
                    'estimatedAudience': sponsor_data.get('subscriberCount') or sponsor_data.get('estimatedSubscribers', 0),
                    'contentTags': sponsor_data.get('tags', []) or sponsor_data.get('contentTags', []),
                    'dateSponsored': datetime.utcnow(),
                    'emailAddress': sponsor_data.get('emailAddress', '')
                }
                
                # Check if this newsletter is already in the array
                newsletters_sponsored = existing_sponsor.get('newslettersSponsored', [])
                newsletter_exists = any(
                    n.get('newsletterName') == newsletter_name 
                    for n in newsletters_sponsored
                )
                
                if not newsletter_exists:
                    # Append new newsletter
                    update_data = {
                        '$push': {'newslettersSponsored': newsletter_entry},
                        '$set': {
                            'lastAnalyzed': datetime.utcnow()
                        }
                    }
                    
                    # Also update contact info if better
                    if sponsor_data.get('sponsorEmail') and not existing_sponsor.get('sponsorEmail'):
                        update_data['$set']['sponsorEmail'] = sponsor_data.get('sponsorEmail')
                        update_data['$set']['contactMethod'] = 'email'
                    
                    if sponsor_data.get('businessContact') and not existing_sponsor.get('businessContact'):
                        update_data['$set']['businessContact'] = sponsor_data.get('businessContact')
                    
                    # Merge tags
                    existing_tags = set(existing_sponsor.get('tags', []))
                    new_tags = set(sponsor_data.get('tags', []))
                    merged_tags = list(existing_tags.union(new_tags))
                    if merged_tags:
                        update_data['$set']['tags'] = merged_tags[:10]  # Limit to 10 tags
                    
                    result = self.collection.update_one(
                        {'_id': existing_sponsor['_id']},
                        update_data
                    )
                    
                    if result.modified_count > 0:
                        logger.info(f"Updated sponsor {existing_sponsor['_id']} with new newsletter")
                        return str(existing_sponsor['_id'])
                    else:
                        logger.warning(f"Failed to update sponsor {existing_sponsor['_id']}")
                        return str(existing_sponsor['_id'])
                else:
                    logger.info(f"Newsletter {newsletter_name} already exists for sponsor {root_domain}")
                    return str(existing_sponsor['_id'])
            else:
                # Create new sponsor with first newsletter entry
                logger.info(f"Creating new sponsor with domain {root_domain}")
                
                # Add timestamps
                sponsor_data['dateAdded'] = datetime.utcnow()
                sponsor_data['lastAnalyzed'] = datetime.utcnow()
                
                # Set default values
                sponsor_data.setdefault('analysisStatus', 'pending')
                sponsor_data.setdefault('discoveryMethod', 'email_scraper')
                sponsor_data.setdefault('confidence', 0.0)
                sponsor_data.setdefault('status', 'pending')
                sponsor_data.setdefault('contactMethod', 'email' if sponsor_data.get('sponsorEmail') else 'none')
                
                # Convert old structure to new structure
                newsletters_sponsored = []
                if newsletter_name:
                    newsletters_sponsored.append({
                        'newsletterName': newsletter_name,
                        'estimatedAudience': sponsor_data.get('subscriberCount') or sponsor_data.get('estimatedSubscribers', 0),
                        'contentTags': sponsor_data.get('tags', []) or sponsor_data.get('contentTags', []),
                        'dateSponsored': datetime.utcnow(),
                        'emailAddress': sponsor_data.get('emailAddress', '')
                    })
                
                sponsor_data['newslettersSponsored'] = newsletters_sponsored
                
                # Remove old fields that are no longer used
                sponsor_data.pop('newsletterSponsored', None)
                sponsor_data.pop('subscriberCount', None)
                sponsor_data.pop('sponsorApplication', None)  # Moving away from applications
                
                result = self.collection.insert_one(sponsor_data)
                logger.info(f"Created sponsor record: {result.inserted_id}")
                return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to create/update sponsor: {e}")
            raise
    
    def update_sponsor(self, sponsor_id: str, update_data: Dict) -> bool:
        """Update an existing sponsor record"""
        try:
            update_data['lastAnalyzed'] = datetime.utcnow()
            
            result = self.collection.update_one(
                {'_id': sponsor_id},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Updated sponsor: {sponsor_id}")
                return True
            else:
                logger.warning(f"No sponsor found to update: {sponsor_id}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to update sponsor {sponsor_id}: {e}")
            raise
    
    def get_sponsor_by_domain(self, domain: str) -> Optional[Dict]:
        """Get sponsor by root domain - check both collections and new structure"""
        try:
            # First check the new sponsors collection (SponsorNew)
            sponsor_new_collection = self.db['sponsornews']
            sponsor = sponsor_new_collection.find_one({'rootDomain': domain})
            if sponsor:
                return sponsor
            
            # Then check the main sponsors collection (old structure)
            sponsor = self.collection.find_one({'rootDomain': domain})
            if sponsor:
                return sponsor
            
            # If not found, check potential sponsors collection
            potential_sponsor = self.db['potentialsponsors'].find_one({'rootDomain': domain})
            return potential_sponsor
            
        except Exception as e:
            logger.error(f"Failed to get sponsor by domain {domain}: {e}")
            return None
    
    def is_domain_denied(self, domain: str) -> bool:
        """Check if domain is in denied domains list"""
        try:
            denied_domain = self.denied_domains_collection.find_one({'rootDomain': domain.lower()})
            return denied_domain is not None
        except Exception as e:
            logger.error(f"Failed to check denied domain {domain}: {e}")
            return False
    
    def add_denied_domain(self, domain: str, reason: str, added_by: str = 'system') -> bool:
        """Add domain to denied domains list"""
        try:
            denied_domain = {
                'rootDomain': domain.lower(),
                'reason': reason,
                'dateAdded': datetime.utcnow(),
                'addedBy': added_by
            }
            result = self.denied_domains_collection.insert_one(denied_domain)
            logger.info(f"Added denied domain: {domain} - {reason}")
            return result.inserted_id is not None
        except Exception as e:
            logger.error(f"Failed to add denied domain {domain}: {e}")
            return False
    
    def get_sponsor_by_link(self, link: str) -> Optional[Dict]:
        """Get sponsor by sponsor link"""
        try:
            return self.collection.find_one({'sponsorLink': link})
        except Exception as e:
            logger.error(f"Failed to get sponsor by link {link}: {e}")
            return None
    
    def get_pending_sponsors(self) -> List[Dict]:
        """Get all sponsors with pending analysis status"""
        try:
            return list(self.collection.find({'analysisStatus': 'pending'}))
        except Exception as e:
            logger.error(f"Failed to get pending sponsors: {e}")
            return []
    
    def get_manual_review_sponsors(self) -> List[Dict]:
        """Get all sponsors requiring manual review"""
        try:
            return list(self.collection.find({'analysisStatus': 'manual_review_required'}))
        except Exception as e:
            logger.error(f"Failed to get manual review sponsors: {e}")
            return []
    
    def get_sponsors_by_newsletter(self, newsletter: str) -> List[Dict]:
        """Get all sponsors from a specific newsletter"""
        try:
            return list(self.collection.find({'sourceNewsletter': newsletter}))
        except Exception as e:
            logger.error(f"Failed to get sponsors by newsletter {newsletter}: {e}")
            return []
    
    def get_all_sponsors(self, limit: int = 100) -> List[Dict]:
        """Get all sponsors with optional limit"""
        try:
            return list(self.collection.find().limit(limit))
        except Exception as e:
            logger.error(f"Failed to get all sponsors: {e}")
            return []
    
    def delete_sponsor(self, sponsor_id: str) -> bool:
        """Delete a sponsor record"""
        try:
            result = self.collection.delete_one({'_id': sponsor_id})
            if result.deleted_count > 0:
                logger.info(f"Deleted sponsor: {sponsor_id}")
                return True
            else:
                logger.warning(f"No sponsor found to delete: {sponsor_id}")
                return False
        except Exception as e:
            logger.error(f"Failed to delete sponsor {sponsor_id}: {e}")
            return False
    
    def create_affiliate(self, affiliate_data: Dict) -> str:
        """Create a new affiliate record or update existing one with newsletter info"""
        try:
            root_domain = affiliate_data.get('rootDomain', '')
            
            if not root_domain:
                logger.warning("No rootDomain provided, cannot create/update affiliate")
                raise ValueError("rootDomain is required")
            
            # Use affiliates collection
            affiliates_collection = self.db['affiliates']
            
            # Check if affiliate with same rootDomain already exists
            existing_affiliate = affiliates_collection.find_one({'rootDomain': root_domain})
            
            if existing_affiliate:
                # Update existing affiliate: append newsletter to affiliatedNewsletters array
                logger.info(f"Affiliate with domain {root_domain} exists, appending newsletter info")
                
                # Get the first newsletter entry from the data
                new_newsletter = affiliate_data.get('affiliatedNewsletters', [{}])[0] if affiliate_data.get('affiliatedNewsletters') else {}
                
                # Check if this newsletter is already in the array
                affiliated_newsletters = existing_affiliate.get('affiliatedNewsletters', [])
                newsletter_exists = any(
                    n.get('newsletterName') == new_newsletter.get('newsletterName')
                    for n in affiliated_newsletters
                )
                
                if not newsletter_exists and new_newsletter.get('newsletterName'):
                    # Append new newsletter
                    update_data = {
                        '$push': {'affiliatedNewsletters': new_newsletter},
                        '$set': {
                            'dateAdded': existing_affiliate.get('dateAdded', datetime.utcnow()),
                            'lastUpdated': datetime.utcnow()
                        }
                    }
                    
                    # Merge tags
                    existing_tags = set(existing_affiliate.get('tags', []))
                    new_tags = set(affiliate_data.get('tags', []))
                    merged_tags = list(existing_tags.union(new_tags))
                    if merged_tags:
                        update_data['$set']['tags'] = merged_tags[:10]  # Limit to 10 tags
                    
                    result = affiliates_collection.update_one(
                        {'_id': existing_affiliate['_id']},
                        update_data
                    )
                    
                    if result.modified_count > 0:
                        logger.info(f"Updated affiliate {existing_affiliate['_id']} with new newsletter")
                        return str(existing_affiliate['_id'])
                    else:
                        logger.warning(f"Failed to update affiliate {existing_affiliate['_id']}")
                        return str(existing_affiliate['_id'])
                else:
                    logger.info(f"Newsletter already exists for affiliate {root_domain}")
                    return str(existing_affiliate['_id'])
            else:
                # Create new affiliate
                logger.info(f"Creating new affiliate with domain {root_domain}")
                
                # Add timestamps
                affiliate_data['dateAdded'] = datetime.utcnow()
                affiliate_data['lastUpdated'] = datetime.utcnow()
                
                # Set default values
                affiliate_data.setdefault('status', 'pending')
                affiliate_data.setdefault('tags', [])
                affiliate_data.setdefault('affiliatedNewsletters', [])
                affiliate_data.setdefault('interestedUsers', [])
                
                result = affiliates_collection.insert_one(affiliate_data)
                logger.info(f"Created affiliate record: {result.inserted_id}")
                return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to create/update affiliate: {e}")
            raise
    
    def get_max_subscriber_count_for_newsletter(self, newsletter_name: str) -> int:
        """Get the maximum estimatedSubscribers value for a newsletter from existing records"""
        try:
            if not newsletter_name:
                return 0
            
            # Query sponsors collection for records where newsletterSponsored or sourceNewsletter matches
            # Also check newslettersSponsored array for newsletterName matches
            query = {
                '$or': [
                    {'newsletterSponsored': newsletter_name},
                    {'sourceNewsletter': newsletter_name},
                    {'newslettersSponsored.newsletterName': newsletter_name}
                ]
            }
            
            # Find all matching sponsors
            matching_sponsors = list(self.collection.find(query))
            
            max_subscribers = 0
            
            # Check top-level estimatedSubscribers field
            for sponsor in matching_sponsors:
                estimated = sponsor.get('estimatedSubscribers', 0)
                if estimated and isinstance(estimated, (int, float)) and estimated > max_subscribers:
                    max_subscribers = int(estimated)
            
            # Check newslettersSponsored array for estimatedAudience
            for sponsor in matching_sponsors:
                newsletters = sponsor.get('newslettersSponsored', [])
                for newsletter in newsletters:
                    if newsletter.get('newsletterName') == newsletter_name:
                        audience = newsletter.get('estimatedAudience', 0)
                        if audience and isinstance(audience, (int, float)) and audience > max_subscribers:
                            max_subscribers = int(audience)
            
            if max_subscribers > 0:
                logger.info(f"Found max subscriber count for '{newsletter_name}': {max_subscribers:,}")
            else:
                logger.debug(f"No existing subscriber count found for '{newsletter_name}'")
            
            return max_subscribers
            
        except Exception as e:
            logger.error(f"Failed to get max subscriber count for newsletter {newsletter_name}: {e}")
            return 0
    
    def get_stats(self) -> Dict:
        """Get database statistics"""
        try:
            total = self.collection.count_documents({})
            pending = self.collection.count_documents({'analysisStatus': 'pending'})
            complete = self.collection.count_documents({'analysisStatus': 'complete'})
            manual_review = self.collection.count_documents({'analysisStatus': 'manual_review_required'})
            
            return {
                'total_sponsors': total,
                'pending': pending,
                'complete': complete,
                'manual_review_required': manual_review
            }
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return {}
