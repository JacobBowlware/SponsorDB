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
        """Create a new sponsor record"""
        try:
            # Add timestamps
            sponsor_data['dateAdded'] = datetime.utcnow()
            sponsor_data['lastAnalyzed'] = datetime.utcnow()
            
            # Set default values
            sponsor_data.setdefault('analysisStatus', 'pending')
            sponsor_data.setdefault('discoveryMethod', 'email_scraper')
            sponsor_data.setdefault('confidence', 0.0)
            
            result = self.collection.insert_one(sponsor_data)
            logger.info(f"Created sponsor record: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to create sponsor: {e}")
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
        """Get sponsor by root domain - check both collections"""
        try:
            # First check the main sponsors collection
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
