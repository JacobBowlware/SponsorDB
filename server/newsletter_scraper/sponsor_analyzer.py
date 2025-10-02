import logging
import re
import requests
from typing import List, Dict, Optional, Tuple
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from config import (
    EXCLUDED_DOMAINS, NON_SPONSOR_COMPANIES, 
    TAGS, BUSINESS_EMAIL_PATTERNS
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
            # Parse URL
            parsed_url = urlparse(link)
            root_domain = self._extract_root_domain(parsed_url.netloc)
            
            # 1. STRICT DOMAIN BLACKLISTING - Check first!
            if self._is_blacklisted(link, root_domain):
                logger.debug(f"Blacklisted URL/domain: {link}")
                return None
            
            # 2. REQUIRE MINIMUM TEXT CONTEXT
            if not self._has_sufficient_context(link, context):
                logger.debug(f"Insufficient sponsorship context for: {link}")
                return None
            
            # 3. VALIDATE COMPANY NAME QUALITY
            company_name = self._extract_company_name_from_context(link, context, root_domain)
            if not self._is_valid_company_name(company_name):
                logger.debug(f"Invalid company name: {company_name}")
                return None
            
            # 4. Check if it's a non-sponsor company
            if self._is_non_sponsor_company(company_name, root_domain):
                logger.debug(f"Non-sponsor company: {company_name}")
                return None
            
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
            additional_info = self._scrape_website_info(link, root_domain)
            if additional_info:
                sponsor_data.update(additional_info)
            
            logger.info(f"Successfully analyzed sponsor: {company_name} ({root_domain})")
            return sponsor_data
            
        except Exception as e:
            logger.warning(f"Failed to analyze link {link}: {e}")
            return None
    
    def _is_blacklisted(self, url: str, domain: str) -> bool:
        """Check if URL or domain is blacklisted"""
        # Check exact domain matches
        if domain.lower() in [d.lower() for d in EXCLUDED_DOMAINS]:
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
                return True
        
        # Check for blog/content site indicators
        if self._is_blog_or_content_site(domain, url):
            return True
        
        # Check if it's likely a business (not content) site
        if not self._is_likely_business_site(domain, url):
            return True
        
        return False
    
    def _is_blog_or_content_site(self, domain: str, url: str) -> bool:
        """Detect if domain is a blog, news site, or content platform"""
        domain_lower = domain.lower()
        url_lower = url.lower()
        
        # Common blog/content site patterns
        blog_indicators = [
            'blog', 'news', 'article', 'post', 'story', 'journal',
            'times', 'daily', 'weekly', 'magazine', 'media',
            'today', 'hustle', 'information', 'engineering',
            'research', 'verse', 'marketer', 'newsletter'
        ]
        
        # Check if domain contains blog indicators
        for indicator in blog_indicators:
            if indicator in domain_lower:
                return True
        
        # Check for common content site TLDs and patterns
        content_tlds = ['.co', '.io', '.ai', '.news', '.blog']
        for tld in content_tlds:
            if domain_lower.endswith(tld) and len(domain_lower.split('.')) == 2:
                # Single word domains with these TLDs are often content sites
                return True
        
        # Check URL patterns that indicate content
        content_url_patterns = [
            r'/blog/', r'/news/', r'/article/', r'/post/', r'/story/',
            r'/202\d/', r'/january/', r'/february/', r'/march/', r'/april/',
            r'/may/', r'/june/', r'/july/', r'/august/', r'/september/',
            r'/october/', r'/november/', r'/december/'
        ]
        
        for pattern in content_url_patterns:
            if re.search(pattern, url_lower):
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
            return False
        
        # Get 200 chars before and after link
        start = max(0, link_pos - 200)
        end = min(len(section_text), link_pos + len(link) + 200)
        context = section_text[start:end].upper()
        
        # Must have sponsor keywords within 200 chars
        required_keywords = ['SPONSOR', 'PARTNER', 'BROUGHT TO YOU', 'PRESENTED BY', 'PAID']
        has_keyword = any(kw in context for kw in required_keywords)
        
        # Must have CTA or business language
        business_terms = ['TRY', 'GET', 'START', 'LEARN', 'VISIT', 'DISCOUNT', 'CODE', 'OFFER']
        has_business_term = any(term in context for term in business_terms)
        
        # Additional validation: check for content indicators that suggest this is NOT a sponsor
        content_indicators = [
            'READ MORE', 'FULL ARTICLE', 'CONTINUE READING', 'LEARN MORE',
            'BLOG POST', 'NEWS ARTICLE', 'STORY', 'JOURNAL', 'MAGAZINE',
            'TODAY\'S NEWS', 'DAILY UPDATE', 'WEEKLY ROUNDUP'
        ]
        
        has_content_indicator = any(indicator in context for indicator in content_indicators)
        
        # If it has content indicators, it's likely not a sponsor
        if has_content_indicator:
            return False
        
        return has_keyword and has_business_term
    
    def _is_valid_company_name(self, name: str) -> bool:
        """Validate extracted company name is legitimate"""
        if not name or len(name) < 3:
            return False
        
        # Invalid patterns
        invalid_patterns = [
            r'^\d+$',  # Just numbers
            r'^[^a-zA-Z]+$',  # No letters
            r'.*\[.*\].*',  # Contains brackets like [12]
            r'^(click|read|learn|view|see|watch|listen)',  # CTA phrases
            r'(here|more|now|today)$',  # Generic endings
            r'(oops|error|javascript|telegram|opt out)',  # Error messages
            r'^\W+$',  # Just punctuation
            r'.*→.*',  # Arrow characters
            r'^\d+\s*(st|nd|rd|th)',  # Addresses
        ]
        
        name_lower = name.lower()
        for pattern in invalid_patterns:
            if re.search(pattern, name_lower, re.I):
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
                return False
        
        # Check for sentence-like patterns (blog post titles)
        if len(name.split()) > 6:  # Long titles are usually blog posts
            return False
        
        # Check for question patterns
        if name.endswith('?') or name.startswith(('what', 'how', 'why', 'when', 'where')):
            return False
        
        # Must have at least one letter
        if not re.search(r'[a-zA-Z]', name):
            return False
        
        # Reasonable length
        if len(name) > 100:
            return False
        
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
            r'([A-Z][a-zA-Z\s&]+?)\s+(?:is|offers|provides|helps|makes|creates|builds)',
            r'([A-Z][a-zA-Z\s&]+?)\s+(?:sponsors|partners?|presents)',
            r'(?:sponsored by|brought to you by|presented by|partnered with)\s+([A-Z][a-zA-Z\s&]+)',
            r'([A-Z][a-zA-Z\s&]+?)\s+(?:try|get|start|learn|visit)',
        ]
        
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
        
        # Split by dots and take last two parts
        parts = netloc.split('.')
        if len(parts) >= 2:
            return '.'.join(parts[-2:])
        
        return netloc
    
    def _is_non_sponsor_company(self, company_name: str, domain: str) -> bool:
        """Check if this is a known non-sponsor company"""
        name_lower = company_name.lower()
        domain_lower = domain.lower()
        
        for non_sponsor in NON_SPONSOR_COMPANIES:
            if non_sponsor.lower() in name_lower or non_sponsor.lower() in domain_lower:
                return True
        
        return False
    
    def _scrape_website_info(self, url: str, domain: str) -> Optional[Dict]:
        """Scrape additional information from the website"""
        try:
            # Only scrape if we have a reasonable URL
            if not url.startswith(('http://', 'https://')):
                return None
            
            # Set a timeout to avoid hanging
            response = requests.get(url, timeout=10, headers={
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
            
            # Try to find contact email
            contact_email = self._find_contact_email(soup, domain)
            
            info = {}
            if title_text and self._is_valid_company_name(title_text):
                info['extractedTitle'] = title_text
            if description:
                info['extractedDescription'] = description
            if contact_email:
                info['sponsorEmail'] = contact_email
                info['contactMethod'] = 'email'
            
            return info if info else None
            
        except Exception as e:
            logger.debug(f"Failed to scrape website {url}: {e}")
            return None
    
    def _find_contact_email(self, soup: BeautifulSoup, domain: str) -> Optional[str]:
        """Find contact email on the website"""
        # Look for common email patterns
        email_patterns = [
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        ]
        
        text = soup.get_text()
        for pattern in email_patterns:
            matches = re.findall(pattern, text)
            for email in matches:
                email_lower = email.lower()
                # Check if it's a business contact email
                if any(business_pattern in email_lower for business_pattern in BUSINESS_EMAIL_PATTERNS):
                    return email
                # Or if it's from the same domain
                if domain.lower() in email_lower:
                    return email
        
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
            
            Please provide:
            1. A clean, professional company name
            2. What type of business this is (Technology, Finance, etc.)
            3. Whether this appears to be a legitimate business that could sponsor newsletters
            4. Any relevant tags or categories
            
            Respond in JSON format with: companyName, businessType, isLegitimate, tags
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
                    sponsor_data['tags'] = gpt_data['tags'][:5]  # Limit to 5 tags
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