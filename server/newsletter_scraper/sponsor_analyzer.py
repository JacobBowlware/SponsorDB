import logging
import re
import requests
from typing import List, Dict, Optional, Tuple
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from config import (
    EXCLUDED_DOMAINS, NON_SPONSOR_COMPANIES, KNOWN_SPONSORS,
    TAGS, BUSINESS_EMAIL_PATTERNS, AFFILIATE_INDICATORS
)

logger = logging.getLogger(__name__)

class SponsorAnalyzer:
    def __init__(self):
        self.openai_client = None
        # Try to initialize OpenAI client
        try:
            import openai
            from config import OPENAI_API_KEY
            if OPENAI_API_KEY:
                self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
                logger.info("OpenAI client initialized")
        except Exception as e:
            logger.warning(f"OpenAI client not available: {e}")
    
    def analyze_sponsor_section(self, section_data: Dict, newsletter_name: str) -> List[Dict]:
        """Analyze a sponsor section and extract sponsor information"""
        try:
            section_text = section_data.get('section_text', '')
            links = section_data.get('links', [])
            
            if not links:
                logger.debug("No links found in sponsor section")
                return []
            
            sponsors = []
            for link in links:
                try:
                    sponsor = self._analyze_single_link(link, section_text, newsletter_name)
                    if sponsor:
                        sponsors.append(sponsor)
                except Exception as e:
                    logger.warning(f"Failed to analyze link {link}: {e}")
                    continue
            
            logger.info(f"Extracted {len(sponsors)} sponsors from section")
            return sponsors
            
        except Exception as e:
            logger.error(f"Failed to analyze sponsor section: {e}")
            return []
    
    def _analyze_single_link(self, link: str, context: str, newsletter_name: str) -> Optional[Dict]:
        """Analyze a single link and extract sponsor information"""
        try:
            logger.info(f"=== ANALYZING LINK: {link} ===")
            
            # Parse URL
            parsed_url = urlparse(link)
            root_domain = self._extract_root_domain(parsed_url.netloc)
            logger.info(f"Root domain: {root_domain}")
            
            # 1. STRICT DOMAIN BLACKLISTING - Check first!
            if self._is_blacklisted(link, root_domain):
                logger.info(f"REJECTED: Blacklisted - {link}")
                return None
            logger.info(f"✓ Passed blacklist check")
            
            # 2. CHECK FOR SELF-REFERENCE - Newsletter advertising itself
            newsletter_domain = self._extract_newsletter_domain(newsletter_name)
            if newsletter_domain and root_domain.lower() == newsletter_domain.lower():
                logger.info(f"REJECTED: Self-reference - {root_domain} matches {newsletter_domain}")
                return None
            
            # 2b. CHECK FOR NEWSLETTER SELF-PROMOTION PATTERNS
            if self._is_newsletter_self_promotion(root_domain, context):
                logger.info(f"REJECTED: Newsletter self-promotion - {root_domain}")
                return None
            logger.info(f"✓ Passed self-reference check")
            
            # 3. REQUIRE MINIMUM TEXT CONTEXT
            if not self._has_sufficient_context(link, context):
                logger.info(f"REJECTED: Insufficient context - {link}")
                return None
            logger.info(f"✓ Passed context check")
            
            # 4. VALIDATE COMPANY NAME QUALITY
            company_name = self._extract_company_name_from_context(link, context, root_domain)
            logger.info(f"Extracted company name: {company_name}")
            if not self._is_valid_company_name(company_name):
                logger.info(f"REJECTED: Invalid company name - {company_name}")
                return None
            logger.info(f"✓ Passed company name validation")
            
            # 5. Check if it's a non-sponsor company
            if self._is_non_sponsor_company(company_name, root_domain):
                logger.info(f"REJECTED: Non-sponsor company - {company_name}")
                return None
            logger.info(f"✓ Passed non-sponsor check")
            
            # 6. STRENGTHEN SPONSOR VALIDATION - Must be legitimate business
            if not self._is_legitimate_company(company_name, root_domain, link):
                logger.info(f"REJECTED: Not legitimate company - {company_name}")
                return None
            logger.info(f"✓ Passed legitimacy check")
            
            logger.info(f"SUCCESS: Sponsor passed all checks - {company_name}")
            
            # Create sponsor data
            sponsor_data = {
                'sponsorName': company_name,
                'sponsorLink': link,
                'rootDomain': root_domain,
                'newsletterSponsored': newsletter_name,
                'sourceNewsletter': newsletter_name,
                'discoveryMethod': 'email_scraper',
                'analysisStatus': 'pending',
                'confidence': 0.0
            }
            
            # Try to get additional info from the website
            additional_info = self._scrape_website_info(link, root_domain, newsletter_name)
            if additional_info:
                sponsor_data.update(additional_info)
            
            # 7. MANDATORY CONTACT INFO REQUIREMENT
            if not self._has_contact_info(sponsor_data):
                logger.debug(f"No contact info found for: {company_name}")
                # Set analysis status to pending instead of rejecting
                sponsor_data['analysisStatus'] = 'pending'
                sponsor_data['contactMethod'] = 'none'
                # Don't return None - allow it to be saved as pending
            
            # 8. NEWSLETTER AUDIENCE SIZE ESTIMATION
            estimated_subscribers = self._estimate_subscriber_count(context, newsletter_name)
            sponsor_data['estimatedSubscribers'] = estimated_subscribers['count']
            sponsor_data['subscriberReasoning'] = estimated_subscribers['reasoning']
            
            # 9. AFFILIATE PROGRAM DETECTION
            is_affiliate = self._detect_affiliate_program(sponsor_data, context)
            if is_affiliate:
                sponsor_data['isAffiliateProgram'] = True
                logger.info(f"Affiliate program detected for: {company_name}")
            
            # 10. AUTOMATIC TAG ASSIGNMENT
            assigned_tags = self._assign_tags_ai(sponsor_data)
            
            # 11. ENSURE AFFILIATE TAG IS ADDED FOR AFFILIATE PROGRAMS
            if is_affiliate and 'Affiliate' not in assigned_tags:
                assigned_tags.append('Affiliate')
                # Keep only 3 tags maximum
                assigned_tags = assigned_tags[:3]
                logger.info(f"Added Affiliate tag for affiliate program: {company_name}")
            
            sponsor_data['tags'] = assigned_tags
            logger.info(f"Final assigned tags: {assigned_tags}")
            
            logger.info(f"Successfully analyzed sponsor: {company_name} ({root_domain})")
            return sponsor_data
            
        except Exception as e:
            logger.warning(f"Failed to analyze link {link}: {e}")
            return None
    
    def _is_blacklisted(self, url: str, domain: str) -> bool:
        """Check if URL or domain is blacklisted"""
        # Check exact domain matches
        if domain.lower() in [d.lower() for d in EXCLUDED_DOMAINS]:
            logger.debug(f"Blacklist reason: Exact domain match - {domain}")
            return True
        
        # Check for common unwanted patterns
        url_lower = url.lower()
        unwanted_patterns = [
            r'.*unsubscribe.*',
            r'.*opt-out.*',
            r'.*preferences.*',
            r'.*manage.*subscription.*',
            r'.*cdn\..*',  # CDN domains
            r'.*analytics.*',
            r'.*tracking.*'
        ]
        
        for pattern in unwanted_patterns:
            if re.search(pattern, url_lower):
                logger.debug(f"Blacklist reason: Unwanted pattern '{pattern}' - {url}")
                return True
        
        # Check for blog/content site indicators
        if self._is_blog_or_content_site(domain, url):
            logger.debug(f"Blacklist reason: Blog/content site - {domain}")
            return True
        
        # CHANGED: Commented out the _is_likely_business_site check as it's too restrictive
        # and blocks legitimate sponsors. Let the _is_legitimate_company method handle this.
        # if not self._is_likely_business_site(domain, url):
        #     return True
        
        return False
    
    def _is_blog_or_content_site(self, domain: str, url: str) -> bool:
        """Detect if domain is a blog, news site, or content platform (less aggressive)"""
        domain_lower = domain.lower()
        url_lower = url.lower()
        
        # More conservative blog/content site patterns
        blog_indicators = [
            'blog', 'news', 'article', 'post', 'story', 'journal',
            'times', 'daily', 'weekly', 'magazine', 'media',
            'today', 'hustle', 'information', 'engineering',
            'research', 'verse', 'marketer', 'newsletter',
            'upside', 'donut', 'valley'
        ]
        
        # CHANGED: Only reject if domain has 2+ blog indicators OR is in known_content_domains
        # Single word matches are too aggressive
        indicator_count = sum(1 for indicator in blog_indicators if indicator in domain_lower)
        if indicator_count >= 2:  # Require multiple matches
            logger.debug(f"Multiple blog indicators ({indicator_count}) found in domain: {domain}")
            return True
        
        # Check for common content site TLDs and patterns (more restrictive)
        content_tlds = ['.news', '.blog', '.media']
        for tld in content_tlds:
            if domain_lower.endswith(tld) and len(domain_lower.split('.')) == 2:
                # Single word domains with these TLDs are often content sites
                logger.debug(f"Content TLD '{tld}' found in domain: {domain}")
                return True
        
        # Check URL patterns that indicate content
        content_url_patterns = [
            r'/blog/', r'/news/', r'/article/', r'/post/', r'/story/',
            r'/202\d/', r'/january/', r'/february/', r'/march/', r'/april/',
            r'/may/', r'/june/', r'/july/', r'/august/', r'/september/',
            r'/october/', r'/november/', r'/december/',
            r'/category/', r'/tag/', r'/author/', r'/archive/',
            r'/feed/', r'/rss/', r'/sitemap'
        ]
        
        for pattern in content_url_patterns:
            if re.search(pattern, url_lower):
                logger.debug(f"Content URL pattern '{pattern}' found in URL: {url}")
                return True
        
        # Known content domains (exact matches only)
        known_content_domains = [
            'socialmediatoday.com', 'searchengineland.com', 'theinformation.com',
            'interestingengineering.com', 'techcrunch.com', 'mashable.com',
            'engadget.com', 'wired.com', 'venturebeat.com', 'theverge.com',
            'arstechnica.com', 'recode.com', 'buzzfeed.com', 'huffpost.com',
            'medium.com', 'substack.com', 'ghost.io', 'wordpress.com',
            'tumblr.com', 'blogger.com'
        ]
        
        if domain_lower in known_content_domains:
            logger.debug(f"Known content domain: {domain}")
            return True
        
        return False
    
    def _is_likely_business_site(self, domain: str, url: str) -> bool:
        """Check if domain appears to be a legitimate business (not content/blog)"""
        domain_lower = domain.lower()
        url_lower = url.lower()
        
        # Business indicators
        business_indicators = [
            'app', 'platform', 'software', 'tool', 'service', 'solution',
            'company', 'corp', 'inc', 'llc', 'ltd', 'group', 'tech',
            'systems', 'labs', 'works', 'studio', 'agency', 'consulting'
        ]
        
        # Check if domain contains business indicators
        for indicator in business_indicators:
            if indicator in domain_lower:
                return True
        
        # Check for business TLDs
        business_tlds = ['.com', '.org', '.net', '.co', '.io', '.ai']
        if any(domain_lower.endswith(tld) for tld in business_tlds):
            # Additional check: single word domains with business TLDs are often businesses
            if len(domain_lower.split('.')) == 2 and len(domain_lower.split('.')[0]) > 3:
                return True
        
        # Check URL patterns that suggest business pages
        business_url_patterns = [
            r'/pricing', r'/plans', r'/features', r'/about', r'/contact',
            r'/signup', r'/login', r'/demo', r'/trial', r'/free',
            r'/product', r'/services', r'/solutions'
        ]
        
        for pattern in business_url_patterns:
            if re.search(pattern, url_lower):
                return True
        
        # If it's a very short domain (likely a business), allow it
        if len(domain_lower) <= 12 and '.' in domain_lower:
            return True
        
        return False
    
    def _has_sufficient_context(self, link: str, section_text: str) -> bool:
        """Check if link has sufficient sponsorship context around it"""
        # Find link position in text
        link_pos = section_text.find(link)
        if link_pos == -1:
            # Try to find just the domain
            from urllib.parse import urlparse
            domain = urlparse(link).netloc
            link_pos = section_text.find(domain)
            if link_pos == -1:
                logger.debug(f"Link not found in section text")
                return False
        
        # Get 300 chars before and after link (increased from 200)
        start = max(0, link_pos - 300)
        end = min(len(section_text), link_pos + len(link) + 300)
        context = section_text[start:end].upper()
        
        logger.debug(f"Context for validation: {context[:200]}...")
        
        # Check for content indicators that suggest this is NOT a sponsor
        content_indicators = [
            'READ MORE', 'FULL ARTICLE', 'CONTINUE READING',
            'BLOG POST', 'NEWS ARTICLE', 'STORY', 'JOURNAL',
            'TODAY\'S NEWS', 'DAILY UPDATE', 'WEEKLY ROUNDUP'
        ]
        
        has_content_indicator = any(indicator in context for indicator in content_indicators)
        if has_content_indicator:
            logger.debug(f"Has content indicators - likely not a sponsor")
            return False
        
        # Strong sponsor indicators - if we find these, we're good
        strong_sponsor_keywords = [
            'SPONSORED BY', 'BROUGHT TO YOU BY', 'PRESENTED BY', 
            'PAID PARTNERSHIP', 'PARTNER CONTENT', 'ADVERTISEMENT'
        ]
        
        if any(kw in context for kw in strong_sponsor_keywords):
            logger.debug(f"Found strong sponsor keyword - approved")
            return True
        
        # Weaker sponsor indicators
        sponsor_keywords = ['SPONSOR', 'PARTNER', 'PAID']
        has_sponsor_keyword = any(kw in context for kw in sponsor_keywords)
        
        # Business/CTA terms
        business_terms = [
            'TRY', 'GET', 'START', 'LEARN', 'VISIT', 'DISCOUNT', 
            'CODE', 'OFFER', 'SIGN UP', 'FREE', 'DEMO', 'PRICING'
        ]
        has_business_term = any(term in context for term in business_terms)
        
        # Accept if we have sponsor keyword OR business term (not both required)
        result = has_sponsor_keyword or has_business_term
        logger.debug(f"Context check result: sponsor_kw={has_sponsor_keyword}, business={has_business_term}, result={result}")
        
        return result
    
    def _is_valid_company_name(self, name: str) -> bool:
        """Validate extracted company name is legitimate"""
        logger.debug(f"Validating company name: '{name}'")
        
        if not name or len(name) < 3:
            logger.debug(f"Company name fail: Too short or empty - '{name}'")
            return False
        
        # Invalid patterns
        invalid_patterns = [
            r'^\d+$',  # Just numbers
            r'^[^a-zA-Z]+$',  # No letters
            r'.*\[.*\].*',  # Contains brackets like [12]
            r'^(click|read|learn|view|see|watch|listen|get|try|visit|sign|start)',  # CTA phrases
            r'(here|more|now|today)$',  # Generic endings
            r'(oops|error|javascript|telegram|opt out)',  # Error messages
            r'^\W+$',  # Just punctuation
            r'.*→.*',  # Arrow characters
            r'^\d+\s*(st|nd|rd|th)',  # Addresses
            r'^(get|try|visit|sign|start|learn|read|click|view|see|watch|listen)$',  # Single action words
        ]
        
        name_lower = name.lower()
        for pattern in invalid_patterns:
            if re.search(pattern, name_lower, re.I):
                logger.debug(f"Company name fail: Invalid pattern '{pattern}' - '{name}'")
                return False
        
        # Check for blog post titles and content indicators
        content_indicators = [
            'hope your organic content', 'what in tarnation',  # From your examples
            'blog', 'article', 'post', 'story', 'news', 'today',
            'daily', 'weekly', 'magazine', 'times', 'journal',
            'research', 'engineering', 'information', 'hustle',
            'marketer', 'newsletter', 'verse', 'upside'
        ]
        
        for indicator in content_indicators:
            if indicator in name_lower:
                logger.debug(f"Company name fail: Content indicator '{indicator}' - '{name}'")
                return False
        
        # Check for sentence-like patterns (blog post titles)
        if len(name.split()) > 6:  # Long titles are usually blog posts
            logger.debug(f"Company name fail: Too many words (likely blog title) - '{name}'")
            return False
        
        # Check for question patterns
        if name.endswith('?') or name.startswith(('what', 'how', 'why', 'when', 'where')):
            logger.debug(f"Company name fail: Question pattern - '{name}'")
            return False
        
        # Must have at least one letter
        if not re.search(r'[a-zA-Z]', name):
            logger.debug(f"Company name fail: No letters - '{name}'")
            return False
        
        # Reasonable length
        if len(name) > 100:
            logger.debug(f"Company name fail: Too long - '{name}'")
            return False
        
        logger.debug(f"Company name validation passed: '{name}'")
        return True
    
    def _extract_company_name_from_context(self, link: str, context: str, domain: str) -> str:
        """Extract company name from context around the link"""
        # Try to find company name before the link
        link_pos = context.find(link)
        if link_pos == -1:
            return domain
        
        # Look for company name in the 100 characters before the link
        before_link = context[max(0, link_pos - 100):link_pos]
        
        # Common patterns for company names before links
        patterns = [
            r'(?:sponsored by|brought to you by|presented by|partnered with)\s+([A-Z][a-zA-Z\s&]+)',
            r'partner:\s*([A-Z][a-zA-Z\s&]+)',
            r'([A-Z][a-zA-Z\s&]+?)\s+(?:is|offers|provides|helps|makes|creates|builds)',
            r'([A-Z][a-zA-Z\s&]+?)\s+(?:sponsors|partners?|presents)',
            # More specific patterns to avoid matching "Get" from "Get started"
            r'([A-Z][a-zA-Z\s&]{3,}?)\s+(?:try|start|learn|visit|sign up)',
        ]
        
        # Additional patterns for common sponsor formats
        additional_patterns = [
            r'([A-Z][a-zA-Z\s&]+?)\s+(?:makes it easy|helps|empowers|enables)',
            r'([A-Z][a-zA-Z\s&]+?)\s+(?:is the|are the|has the)',
        ]
        
        patterns.extend(additional_patterns)
        
        for pattern in patterns:
            match = re.search(pattern, before_link, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if self._is_valid_company_name(name):
                    return name
        
        # Fallback to domain name
        return domain
    
    def _extract_root_domain(self, netloc: str) -> str:
        """Extract root domain from netloc"""
        if not netloc:
            return ""
        
        # Remove www. prefix
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        
        # Use tldextract library for proper domain parsing
        import tldextract
        extracted = tldextract.extract(netloc)
        
        # Return domain.suffix (e.g., "company.com" or "company.co.uk")
        if extracted.domain and extracted.suffix:
            return f"{extracted.domain}.{extracted.suffix}"
        
        # Fallback to original logic if tldextract fails
        parts = netloc.split('.')
        if len(parts) >= 2:
            return '.'.join(parts[-2:])
        
        return netloc
    
    def _extract_newsletter_domain(self, newsletter_name: str) -> Optional[str]:
        """Extract domain from newsletter name (e.g., 'crew@stackedmarketer.com' -> 'stackedmarketer.com')"""
        if not newsletter_name:
            return None
        
        # Look for email pattern in newsletter name
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', newsletter_name)
        if email_match:
            return email_match.group(1)
        
        # Look for domain pattern
        domain_match = re.search(r'([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', newsletter_name)
        if domain_match:
            return domain_match.group(1)
        
        return None
    
    def _is_non_sponsor_company(self, company_name: str, domain: str) -> bool:
        """Check if this is a known non-sponsor company"""
        name_lower = company_name.lower()
        domain_lower = domain.lower()
        
        for non_sponsor in NON_SPONSOR_COMPANIES:
            if non_sponsor.lower() in name_lower or non_sponsor.lower() in domain_lower:
                return True
        
        return False
    
    def _is_newsletter_self_promotion(self, domain: str, context: str) -> bool:
        """Check if this is a newsletter advertising its own sponsorship opportunities"""
        domain_lower = domain.lower()
        context_lower = context.lower()
        
        # Check for newsletter self-promotion patterns
        self_promotion_patterns = [
            r'advertise\s+with\s+us',
            r'sponsor\s+our\s+newsletter',
            r'advertising\s+opportunities',
            r'media\s+kit',
            r'partnership\s+opportunities',
            r'reach\s+over\s+\d+\s+million',
            r'get\s+your\s+brand\s+in\s+front',
            r'newsletter\s+advertising',
            r'sponsor\s+this\s+newsletter',
            r'advertise\s+in\s+our\s+newsletter',
            r'newsletter\s+sponsorship',
            r'brand\s+in\s+front\s+of\s+developers',
            r'copywriting\s+services\s+and\s+campaign',
            r'customer\s+success\s+manager',
            r'guarantee\s+your\s+campaign',
            r'newsletter\s+best\s+practices',
            r'audiences\s+case\s+studies'
        ]
        
        # Check if context contains newsletter self-promotion language
        for pattern in self_promotion_patterns:
            if re.search(pattern, context_lower):
                logger.debug(f"Newsletter self-promotion pattern detected: {pattern}")
                return True
        
        # Check for common newsletter advertising domains
        newsletter_ad_domains = [
            'tldr.tech', 'tldrnewsletter.com', 'stackedmarketer.com',
            'thehustle.co', 'morningbrew.com', 'marketingbrew.com'
        ]
        
        for ad_domain in newsletter_ad_domains:
            if ad_domain in domain_lower:
                logger.debug(f"Newsletter advertising domain detected: {ad_domain}")
                return True
        
        return False

    def _is_newsletter_sponsor_page(self, application_url: str, newsletter_name: str, sponsor_domain: str) -> bool:
        """Check if this is the newsletter's 'sponsor us' page instead of the sponsor company's page"""
        if not application_url:
            return False
        
        # Extract domain from application URL
        app_domain = urlparse(application_url).netloc.lower()
        
        # Get newsletter domain
        newsletter_domain = self._extract_newsletter_domain(newsletter_name)
        
        # If application URL is on the NEWSLETTER'S domain, it's wrong
        if newsletter_domain and newsletter_domain.lower() in app_domain:
            logger.debug(f"Application URL is on newsletter domain - rejecting: {application_url}")
            return True
        
        # If application URL is NOT on the sponsor's domain, it's suspicious
        if sponsor_domain.lower() not in app_domain:
            logger.debug(f"Application URL is not on sponsor domain - potential issue: {application_url} vs {sponsor_domain}")
            return True
        
        return False
    
    def _is_legitimate_company(self, company_name: str, domain: str, url: str) -> bool:
        """Check if this is a legitimate business that could sponsor newsletters"""
        domain_lower = domain.lower()
        url_lower = url.lower()
        name_lower = company_name.lower()
        
        # Check whitelist first - known legitimate sponsors
        for known_sponsor in KNOWN_SPONSORS:
            if (known_sponsor.lower() in domain_lower or 
                known_sponsor.lower() in name_lower):
                logger.debug(f"Whitelist match: {known_sponsor} - {domain}")
                return True
        
        # Must not be clearly a blog/content site (relaxed check)
        if self._is_clearly_content_site(domain, url, name_lower):
            logger.debug(f"Legitimacy fail: Blog/content site - {domain}")
            return False
        
        # Must have evidence of B2B business model OR business page structure
        business_indicators = [
            'app', 'platform', 'software', 'tool', 'service', 'solution',
            'company', 'corp', 'inc', 'llc', 'ltd', 'group', 'tech',
            'systems', 'labs', 'works', 'studio', 'agency', 'consulting',
            'api', 'saas', 'cloud', 'enterprise', 'business', 'professional'
        ]
        
        has_business_indicator = any(indicator in domain_lower or indicator in name_lower 
                                   for indicator in business_indicators)
        
        if not has_business_indicator:
            logger.debug(f"Legitimacy fail: No business indicators - {domain}, {company_name}")
        else:
            logger.debug(f"Found business indicators in: {domain}, {company_name}")
        
        # Check for business page patterns
        business_url_patterns = [
            r'/contact', r'/about', r'/partnership', r'/partners', r'/advertise',
            r'/media-kit', r'/press', r'/business', r'/enterprise', r'/pricing'
        ]
        
        has_business_page = any(re.search(pattern, url_lower) for pattern in business_url_patterns)
        
        # If it's a root domain, assume it has business pages
        if url_lower == f"https://{domain_lower}" or url_lower == f"http://{domain_lower}":
            has_business_page = True
            logger.debug(f"Root domain detected - assuming business pages: {url}")
        
        if has_business_page:
            logger.debug(f"Found business page patterns in URL: {url}")
        
        # CHANGED: Use OR logic - accept if has business indicators OR business page
        result = has_business_indicator or has_business_page
        logger.debug(f"Legitimacy check result: {result} (business_indicator: {has_business_indicator}, business_page: {has_business_page})")
        return result
    
    def _is_clearly_content_site(self, domain: str, url: str, name_lower: str) -> bool:
        """Check if this is clearly a content/news site (more restrictive than before)"""
        domain_lower = domain.lower()
        url_lower = url.lower()
        
        # Only block if it's clearly a content site with multiple indicators
        content_indicators = [
            'blog', 'news', 'article', 'post', 'story', 'journal',
            'times', 'daily', 'weekly', 'magazine', 'media', 'today',
            'hustle', 'information', 'engineering', 'research', 'verse',
            'marketer', 'newsletter', 'upside', 'donut', 'valley'
        ]
        
        # Count how many content indicators are present
        indicator_count = sum(1 for indicator in content_indicators 
                            if indicator in domain_lower or indicator in name_lower)
        
        # Only reject if 2+ indicators (not just one)
        if indicator_count >= 2:
            return True
        
        # Known content domains (exact matches only)
        known_content_domains = [
            'socialmediatoday.com', 'searchengineland.com', 'theinformation.com',
            'interestingengineering.com', 'techcrunch.com', 'mashable.com',
            'engadget.com', 'wired.com', 'venturebeat.com', 'theverge.com',
            'arstechnica.com', 'recode.com', 'buzzfeed.com', 'huffpost.com',
            'medium.com', 'substack.com', 'ghost.io', 'wordpress.com',
            'tumblr.com', 'blogger.com'
        ]
        
        if domain_lower in known_content_domains:
            return True
        
        return False
    
    def _has_contact_info(self, sponsor_data: Dict) -> bool:
        """Check if sponsor has required contact information"""
        has_email = sponsor_data.get('sponsorEmail') and sponsor_data.get('sponsorEmail').strip()
        has_application = sponsor_data.get('sponsorApplication') and sponsor_data.get('sponsorApplication').strip()
        
        # Must have either valid email OR application page URL
        if has_email or has_application:
            # Update contact method and set as complete
            if has_email and has_application:
                sponsor_data['contactMethod'] = 'both'
            elif has_email:
                sponsor_data['contactMethod'] = 'email'
            else:
                sponsor_data['contactMethod'] = 'application'
            
            # Only mark as complete if we have contact info
            sponsor_data['analysisStatus'] = 'complete'
            return True
        
        # No contact found - set to none and pending
        sponsor_data['contactMethod'] = 'none'
        sponsor_data['analysisStatus'] = 'pending'
        return False
    
    def _estimate_subscriber_count(self, context: str, newsletter_name: str) -> Dict:
        """Estimate newsletter audience size with conservative estimates"""
        context_lower = context.lower()
        
        # Look for explicit subscriber mentions
        subscriber_patterns = [
            r'(\d{1,3}(?:,\d{3})*)\s*subscribers?',
            r'(\d{1,3}(?:,\d{3})*)\s*readers?',
            r'(\d{1,3}(?:,\d{3})*)\s*audience',
            r'(\d{1,3}(?:,\d{3})*)\s*people',
            r'(\d{1,3}(?:,\d{3})*)\s*members?'
        ]
        
        for pattern in subscriber_patterns:
            match = re.search(pattern, context_lower)
            if match:
                count_str = match.group(1).replace(',', '')
                try:
                    count = int(count_str)
                    if count >= 1000:  # Only trust counts >= 1000
                        return {
                            'count': count,
                            'reasoning': f'Found explicit subscriber count: {count:,}'
                        }
                except ValueError:
                    continue
        
        # Look for social proof indicators
        social_proof_indicators = [
            'thousands of', 'millions of', 'hundreds of',
            'growing community', 'large audience', 'massive following',
            'popular newsletter', 'top newsletter', 'leading newsletter'
        ]
        
        has_social_proof = any(indicator in context_lower for indicator in social_proof_indicators)
        
        # Conservative estimates based on newsletter type and indicators
        if 'thousands' in context_lower or 'millions' in context_lower:
            return {
                'count': 50000,  # Large
                'reasoning': 'Found "thousands/millions" indicator - estimated 50K+'
            }
        elif has_social_proof or 'growing' in context_lower:
            return {
                'count': 25000,  # Medium-Large
                'reasoning': 'Found social proof indicators - estimated 25K'
            }
        elif 'community' in context_lower or 'audience' in context_lower:
            return {
                'count': 10000,  # Medium
                'reasoning': 'Found community/audience indicators - estimated 10K'
            }
        else:
            # Default conservative estimate
            return {
                'count': 5000,  # Small-Medium
                'reasoning': 'Conservative default estimate - 5K subscribers'
            }
    
    def _scrape_website_info(self, url: str, domain: str, newsletter_name: str = None) -> Optional[Dict]:
        """Scrape additional information from the website"""
        try:
            # Only scrape if we have a reasonable URL
            if not url.startswith(('http://', 'https://')):
                return None
            
            # CHANGED: Reduced timeout from 10 to 5 seconds
            response = requests.get(url, timeout=5, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ""
            
            # Extract meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '').strip() if meta_desc else ""
            
            # Try to find contact email and application page
            contact_email = self._find_contact_email(soup, domain)
            application_url = self._find_application_url(soup, domain, url)
            
            info = {}
            if title_text and self._is_valid_company_name(title_text):
                info['extractedTitle'] = title_text
            if description:
                info['extractedDescription'] = description
            
            # Set contact information
            if contact_email:
                info['sponsorEmail'] = contact_email
            if application_url:
                # Validate it's not the newsletter's sponsor page
                if newsletter_name and self._is_newsletter_sponsor_page(application_url, newsletter_name, domain):
                    logger.info(f"Rejecting application URL - it's the newsletter's sponsor page, not the company's: {application_url}")
                    application_url = None
                else:
                    info['sponsorApplication'] = application_url
            
            # Determine contact method and confidence
            if contact_email and application_url:
                info['contactMethod'] = 'both'
                info['analysisStatus'] = 'complete'
                info['confidence'] = 0.9  # Very high confidence with both
            elif contact_email:
                info['contactMethod'] = 'email'
                info['analysisStatus'] = 'complete'
                info['confidence'] = 0.8  # High confidence with email
            elif application_url:
                info['contactMethod'] = 'application'
                info['analysisStatus'] = 'complete'
                info['confidence'] = 0.7  # Good confidence with application
            else:
                # No contact found - mark as pending for manual review
                info['contactMethod'] = 'none'
                info['analysisStatus'] = 'pending'
                info['confidence'] = 0.0  # No confidence without contact
            
            return info if info else None
            
        except Exception as e:
            logger.debug(f"Failed to scrape website {url}: {e}")
            # CHANGED: If scraping fails, DON'T reject the sponsor - just mark as pending
            return {
                'contactMethod': 'none',
                'analysisStatus': 'pending',
                'confidence': 0.5  # Medium confidence - needs manual review
            }
    
    def _find_contact_email(self, soup: BeautifulSoup, domain: str) -> Optional[str]:
        """Find contact email on the website - check multiple sources"""
        # Look for common email patterns
        email_patterns = [
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        ]
        
        # First check the main page
        text = soup.get_text()
        email = self._extract_email_from_text(text, domain)
        if email:
            return email
        
        # Look for contact/about links and check those pages
        contact_links = self._find_contact_links(soup)
        for link in contact_links[:3]:  # Limit to first 3 contact links
            try:
                contact_email = self._scrape_contact_page(link, domain)
                if contact_email:
                    return contact_email
            except Exception as e:
                logger.debug(f"Failed to scrape contact page {link}: {e}")
                continue
        
        return None
    
    def _extract_email_from_text(self, text: str, domain: str) -> Optional[str]:
        """Extract business email from text"""
        email_patterns = [
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        ]
        
        for pattern in email_patterns:
            matches = re.findall(pattern, text)
            for email in matches:
                # Clean up the email - remove any extra text that got concatenated
                email = email.strip()
                
                # Validate email format more strictly
                if not self._is_valid_email(email):
                    continue
                    
                email_lower = email.lower()
                # Check if it's a business contact email
                if any(business_pattern in email_lower for business_pattern in BUSINESS_EMAIL_PATTERNS):
                    return email
                # Or if it's from the same domain
                if domain.lower() in email_lower:
                    return email
        
        return None
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format more strictly"""
        if not email or len(email) < 5:
            return False
            
        # Check for malformed emails (contains extra text)
        if len(email) > 100:  # Emails shouldn't be this long
            return False
            
        # Check for common concatenation issues
        if any(word in email.lower() for word in ['documentation', 'get', 'try', 'visit', 'click', 'read']):
            return False
            
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email))
    
    def _find_contact_links(self, soup: BeautifulSoup) -> List[str]:
        """Find contact/about page links"""
        contact_links = []
        
        # Look for common contact page patterns
        contact_patterns = [
            r'/contact', r'/about', r'/team', r'/company', r'/hello',
            r'/reach', r'/get-in-touch', r'/connect'
        ]
        
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            for pattern in contact_patterns:
                if re.search(pattern, href):
                    contact_links.append(link['href'])
                    break
        
        return contact_links
    
    def _scrape_contact_page(self, url: str, domain: str) -> Optional[str]:
        """Scrape a contact page for email"""
        try:
            # Make sure URL is absolute
            if url.startswith('/'):
                url = f"https://{domain}{url}"
            elif not url.startswith('http'):
                url = f"https://{url}"
            
            # CHANGED: Reduced timeout from 10 to 5 seconds
            response = requests.get(url, timeout=5, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            text = soup.get_text()
            
            return self._extract_email_from_text(text, domain)
            
        except Exception as e:
            logger.debug(f"Failed to scrape contact page {url}: {e}")
            return None
    
    def _find_application_url(self, soup: BeautifulSoup, domain: str, base_url: str) -> Optional[str]:
        """Find application/partnership page URL - ONLY specific sponsor pages"""
        # STRICT application page patterns - must be sponsor-specific
        application_patterns = [
            r'/partners', r'/advertise', r'/advertising', r'/media-kit',
            r'/partnership', r'/sponsor', r'/business', r'/enterprise'
        ]
        
        # DO NOT include generic /contact or /pricing pages
        
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            for pattern in application_patterns:
                if re.search(pattern, href):
                    # Make sure it's a full URL
                    if href.startswith('http'):
                        logger.debug(f"Found sponsor application page: {href}")
                        return href
                    elif href.startswith('/'):
                        url = f"https://{domain}{href}"
                        logger.debug(f"Found sponsor application page: {url}")
                        return url
                    else:
                        url = f"https://{domain}/{href}"
                        logger.debug(f"Found sponsor application page: {url}")
                        return url
        
        logger.debug(f"No sponsor-specific application page found for {domain}")
        return None
    
    def gpt_analyze_sponsor(self, sponsor_data: Dict) -> Dict:
        """Use GPT to analyze and enhance sponsor data"""
        if not self.openai_client:
            logger.warning("OpenAI client not available for GPT analysis")
            return sponsor_data
        
        try:
            # Create a prompt for GPT analysis
            prompt = f"""
            Analyze this potential sponsor and provide structured information:
            
            Company: {sponsor_data.get('sponsorName', 'Unknown')}
            Website: {sponsor_data.get('sponsorLink', 'N/A')}
            Domain: {sponsor_data.get('rootDomain', 'N/A')}
            Description: {sponsor_data.get('extractedDescription', 'N/A')}
            Title: {sponsor_data.get('extractedTitle', 'N/A')}
            
            Available tags: {', '.join(TAGS)}
            
            Please provide:
            1. A clean, professional company name
            2. What type of business this is (Technology, Finance, etc.)
            3. Whether this appears to be a legitimate business that could sponsor newsletters
            4. Whether this is an affiliate program (look for referral/commission language)
            5. 1-3 relevant tags from the available list above
            
            Rules for tags:
            - Select 1-3 tags that best describe this company's business
            - Choose from the exact tag names provided above
            - If it's an affiliate program, always include "Affiliate" as one of the tags
            - Be specific and accurate - don't guess
            
            Respond in JSON format with: companyName, businessType, isLegitimate, isAffiliateProgram, tags
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.3
            )
            
            # Parse GPT response and update sponsor data
            gpt_response = response.choices[0].message.content
            logger.info(f"GPT analysis response: {gpt_response}")
            
            # Try to extract JSON from response
            try:
                import json
                gpt_data = json.loads(gpt_response)
                
                # Update sponsor data with GPT insights
                if 'companyName' in gpt_data:
                    sponsor_data['sponsorName'] = gpt_data['companyName']
                if 'businessType' in gpt_data:
                    sponsor_data['businessType'] = gpt_data['businessType']
                if 'tags' in gpt_data and isinstance(gpt_data['tags'], list):
                    # Validate tags are in the allowed list
                    valid_tags = [tag for tag in gpt_data['tags'] if tag in TAGS]
                    sponsor_data['tags'] = valid_tags[:3]  # Limit to 3 tags
                if 'isAffiliateProgram' in gpt_data:
                    sponsor_data['isAffiliateProgram'] = gpt_data['isAffiliateProgram']
                    # If GPT detected affiliate program, ensure Affiliate tag is included
                    if gpt_data['isAffiliateProgram'] and 'Affiliate' not in sponsor_data.get('tags', []):
                        if 'tags' not in sponsor_data:
                            sponsor_data['tags'] = []
                        sponsor_data['tags'].append('Affiliate')
                        # Keep only 3 tags maximum
                        sponsor_data['tags'] = sponsor_data['tags'][:3]
                if 'isLegitimate' in gpt_data:
                    if not gpt_data['isLegitimate']:
                        sponsor_data['analysisStatus'] = 'rejected'
                
                sponsor_data['gptAnalyzed'] = True
                
            except json.JSONDecodeError:
                logger.warning("Failed to parse GPT response as JSON")
            
            return sponsor_data
            
        except Exception as e:
            logger.error(f"GPT analysis failed: {e}")
            return sponsor_data
    
    def _detect_affiliate_program(self, sponsor_data: Dict, context: str) -> bool:
        """Detect if this is an affiliate program based on context and website content"""
        try:
            # Check context for affiliate indicators
            context_upper = context.upper()
            affiliate_found = any(indicator in context_upper for indicator in AFFILIATE_INDICATORS)
            
            if affiliate_found:
                logger.info(f"Affiliate program detected in context for: {sponsor_data.get('sponsorName', 'Unknown')}")
                return True
            
            # Check website content if available
            if sponsor_data.get('sponsorLink'):
                website_content = self._scrape_website_for_affiliate_indicators(sponsor_data['sponsorLink'])
                if website_content:
                    affiliate_found = any(indicator in website_content.upper() for indicator in AFFILIATE_INDICATORS)
                    if affiliate_found:
                        logger.info(f"Affiliate program detected on website for: {sponsor_data.get('sponsorName', 'Unknown')}")
                        return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Failed to detect affiliate program: {e}")
            return False
    
    def _scrape_website_for_affiliate_indicators(self, url: str) -> Optional[str]:
        """Scrape website content to look for affiliate program indicators"""
        try:
            if not url.startswith(('http://', 'https://')):
                return None
            
            response = requests.get(url, timeout=5, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract text content
            text_content = soup.get_text()
            
            # Look for affiliate-related pages
            affiliate_pages = ['/affiliate', '/referral', '/partner', '/affiliates', '/referrals', '/partners']
            for page in affiliate_pages:
                if page in url.lower():
                    return text_content
            
            # Check for affiliate links in the page
            for link in soup.find_all('a', href=True):
                href = link['href'].lower()
                if any(page in href for page in affiliate_pages):
                    return text_content
            
            return text_content
            
        except Exception as e:
            logger.debug(f"Failed to scrape website for affiliate indicators {url}: {e}")
            return None
    
    def _assign_tags_ai(self, sponsor_data: Dict) -> List[str]:
        """Use AI to assign 1-3 relevant tags to the sponsor"""
        if not self.openai_client:
            logger.warning("OpenAI client not available for tag assignment")
            return self._assign_tags_fallback(sponsor_data)
        
        try:
            # Create a prompt for tag assignment
            prompt = f"""
            Analyze this sponsor and assign 1-3 relevant tags from the following list:
            
            Available tags: {', '.join(TAGS)}
            
            Sponsor Information:
            - Company: {sponsor_data.get('sponsorName', 'Unknown')}
            - Website: {sponsor_data.get('sponsorLink', 'N/A')}
            - Domain: {sponsor_data.get('rootDomain', 'N/A')}
            - Description: {sponsor_data.get('extractedDescription', 'N/A')}
            - Title: {sponsor_data.get('extractedTitle', 'N/A')}
            
            Rules:
            1. Select 1-3 tags that best describe this company's business
            2. Choose from the exact tag names provided above
            3. If it's an affiliate program, always include "Affiliate" as one of the tags
            4. Be specific and accurate - don't guess
            5. Return only the tag names separated by commas
            
            Respond with just the tag names (e.g., "Technology, Software, AI")
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.3
            )
            
            # Parse the response
            gpt_response = response.choices[0].message.content.strip()
            logger.info(f"GPT tag assignment response: {gpt_response}")
            
            # Extract tags from response
            assigned_tags = []
            for tag in gpt_response.split(','):
                tag = tag.strip()
                if tag in TAGS:
                    assigned_tags.append(tag)
                else:
                    logger.warning(f"Invalid tag from GPT: {tag}")
            
            # Ensure we have at least one tag
            if not assigned_tags:
                assigned_tags = self._assign_tags_fallback(sponsor_data)
            
            # Limit to 3 tags maximum
            assigned_tags = assigned_tags[:3]
            
            logger.info(f"Assigned tags: {assigned_tags}")
            return assigned_tags
            
        except Exception as e:
            logger.error(f"AI tag assignment failed: {e}")
            return self._assign_tags_fallback(sponsor_data)
    
    def _assign_tags_fallback(self, sponsor_data: Dict) -> List[str]:
        """Fallback tag assignment using keyword matching"""
        try:
            assigned_tags = []
            
            # Get text to analyze
            text_to_analyze = ""
            if sponsor_data.get('extractedDescription'):
                text_to_analyze += sponsor_data['extractedDescription'] + " "
            if sponsor_data.get('extractedTitle'):
                text_to_analyze += sponsor_data['extractedTitle'] + " "
            if sponsor_data.get('sponsorName'):
                text_to_analyze += sponsor_data['sponsorName'] + " "
            
            text_lower = text_to_analyze.lower()
            
            # Check for affiliate indicators first
            if any(indicator.lower() in text_lower for indicator in AFFILIATE_INDICATORS):
                assigned_tags.append('Affiliate')
            
            # Define keyword mappings for tags
            tag_keywords = {
                'Technology': ['tech', 'software', 'app', 'platform', 'api', 'cloud', 'saas', 'digital', 'data', 'ai', 'artificial intelligence'],
                'Finance': ['finance', 'financial', 'banking', 'payment', 'fintech', 'crypto', 'cryptocurrency', 'investment', 'trading', 'money'],
                'Health': ['health', 'healthcare', 'medical', 'fitness', 'wellness', 'mental health', 'therapy', 'doctor', 'clinic', 'hospital'],
                'Education': ['education', 'learning', 'course', 'training', 'school', 'university', 'academy', 'tutorial', 'study', 'teach'],
                'Marketing': ['marketing', 'advertising', 'promotion', 'brand', 'campaign', 'social media', 'seo', 'content', 'growth'],
                'Ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'selling', 'marketplace', 'commerce', 'buy', 'sell'],
                'Business': ['business', 'enterprise', 'corporate', 'company', 'organization', 'management', 'productivity', 'workflow'],
                'Entertainment': ['entertainment', 'gaming', 'music', 'video', 'streaming', 'media', 'fun', 'game', 'play', 'watch'],
                'Travel': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'booking', 'tourism', 'destination', 'journey'],
                'Lifestyle': ['lifestyle', 'life', 'personal', 'home', 'family', 'daily', 'routine', 'living', 'wellness'],
                'Fashion': ['fashion', 'clothing', 'style', 'apparel', 'wear', 'dress', 'outfit', 'trend', 'beauty'],
                'Food': ['food', 'restaurant', 'cooking', 'recipe', 'dining', 'meal', 'kitchen', 'chef', 'culinary'],
                'Sports': ['sports', 'fitness', 'athletic', 'exercise', 'workout', 'gym', 'team', 'player', 'game'],
                'AI': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'automation', 'bot', 'intelligent'],
                'Productivity': ['productivity', 'efficiency', 'organization', 'task', 'project', 'management', 'workflow', 'tools'],
                'Software': ['software', 'app', 'application', 'program', 'tool', 'platform', 'system', 'development']
            }
            
            # Score each tag based on keyword matches
            tag_scores = {}
            for tag, keywords in tag_keywords.items():
                score = sum(1 for keyword in keywords if keyword in text_lower)
                if score > 0:
                    tag_scores[tag] = score
            
            # Sort by score and take remaining slots (up to 3 total)
            sorted_tags = sorted(tag_scores.items(), key=lambda x: x[1], reverse=True)
            remaining_slots = 3 - len(assigned_tags)
            additional_tags = [tag for tag, score in sorted_tags[:remaining_slots]]
            assigned_tags.extend(additional_tags)
            
            # If no tags found, assign "Other"
            if not assigned_tags:
                assigned_tags = ['Other']
            
            logger.info(f"Fallback tag assignment: {assigned_tags}")
            return assigned_tags
            
        except Exception as e:
            logger.error(f"Fallback tag assignment failed: {e}")
            return ['Other']