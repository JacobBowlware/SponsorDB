import logging
import re
import requests
import validators
import tldextract
from typing import Dict, List, Optional, Tuple
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import openai
from config import (
    BUSINESS_EMAIL_PATTERNS, EXCLUDED_DOMAINS, CONFIDENCE_THRESHOLD,
    OPENAI_API_KEY, TAGS, NON_SPONSOR_COMPANIES
)

logger = logging.getLogger(__name__)

class SponsorAnalyzer:
    def __init__(self):
        self.openai_client = None
        if OPENAI_API_KEY:
            openai.api_key = OPENAI_API_KEY
            self.openai_client = openai
        else:
            logger.warning("OpenAI API key not provided - GPT analysis disabled")
    
    def analyze_sponsor_section(self, section_data: Dict, newsletter_name: str) -> List[Dict]:
        """Analyze a sponsor section and extract sponsor information"""
        sponsors = []
        links = section_data.get('links', [])
        section_text = section_data.get('section_text', '')
        sponsor_evidence = section_data.get('sponsor_evidence', '')
        
        for link in links:
            try:
                sponsor_data = self._analyze_single_link(
                    link, section_text, sponsor_evidence, newsletter_name
                )
                if sponsor_data:
                    sponsors.append(sponsor_data)
            except Exception as e:
                logger.warning(f"Failed to analyze link {link}: {e}")
                continue
        
        return sponsors
    
    def _analyze_single_link(self, link: str, context: str, evidence: str, newsletter: str) -> Optional[Dict]:
        """Analyze a single sponsor link"""
        try:
            # Extract domain information
            domain_info = self._extract_domain_info(link)
            if not domain_info:
                return None
            
            root_domain = domain_info['root_domain']
            
            # Check if domain is excluded
            if self._is_excluded_domain(root_domain):
                logger.debug(f"Excluded domain: {root_domain}")
                return None
            
            # NEW: Validate payment/sponsorship context first
            if not self._has_payment_sponsorship_context(context, evidence):
                logger.debug(f"No payment/sponsorship context: {root_domain}")
                return None
            
            # Validate company legitimacy
            if not self._is_legitimate_company(link, root_domain):
                logger.debug(f"Not a legitimate company: {root_domain}")
                return None
            
            # Extract company information
            company_info = self._extract_company_info(link, root_domain)
            if not company_info:
                return None
            
            # Find business contact
            contact_info = self._find_business_contact(link, root_domain)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(link, context, evidence, company_info, contact_info)
            
            # Only process high-confidence sponsors
            if confidence < CONFIDENCE_THRESHOLD:
                logger.debug(f"Low confidence ({confidence:.2f}) for {root_domain}")
                return None
            
            # Create sponsor record
            sponsor_data = {
                'sponsorName': company_info.get('name', ''),
                'sponsorLink': link,
                'rootDomain': root_domain,
                'tags': company_info.get('tags', []),
                'newsletterSponsored': newsletter,
                'subscriberCount': company_info.get('subscriber_count', 0),
                'confidence': confidence,
                'businessContact': contact_info.get('contact', ''),
                'contactMethod': contact_info.get('method', 'none'),
                'estimatedSubscribers': company_info.get('subscriber_count', 0),
                'subscriberReasoning': company_info.get('subscriber_reasoning', ''),
                'enrichmentNotes': company_info.get('enrichment_notes', ''),
                'analysisStatus': 'complete' if confidence >= 0.95 else 'manual_review_required',
                'sponsorshipEvidence': evidence,
                'sourceNewsletter': newsletter,
                'sourceContext': context[:500],  # Limit context length
                'discoveryMethod': 'email_scraper'
            }
            
            logger.info(f"Analyzed sponsor: {company_info.get('name', root_domain)} (confidence: {confidence:.2f})")
            return sponsor_data
            
        except Exception as e:
            logger.error(f"Failed to analyze link {link}: {e}")
            return None
    
    def _extract_domain_info(self, url: str) -> Optional[Dict]:
        """Extract domain information from URL"""
        try:
            if not validators.url(url):
                return None
            
            extracted = tldextract.extract(url)
            root_domain = f"{extracted.domain}.{extracted.suffix}"
            
            return {
                'root_domain': root_domain,
                'domain': extracted.domain,
                'suffix': extracted.suffix,
                'subdomain': extracted.subdomain
            }
        except Exception as e:
            logger.warning(f"Failed to extract domain info from {url}: {e}")
            return None
    
    def _is_excluded_domain(self, domain: str) -> bool:
        """Check if domain should be excluded"""
        return domain.lower() in [d.lower() for d in EXCLUDED_DOMAINS]
    
    def _is_legitimate_company(self, url: str, domain: str) -> bool:
        """Validate if this is a legitimate B2B company - MUCH STRICTER"""
        try:
            # Basic checks
            if not self._has_corporate_website_structure(url, domain):
                return False
            
            # Check for business indicators
            if not self._has_business_indicators(url, domain):
                return False
            
            # NEW: Check if company actually offers sponsorships
            if not self._offers_sponsorships(url, domain):
                return False
            
            # NEW: Check if it's a product/service company vs content site
            if not self._is_product_service_company(url, domain):
                return False
            
            # NEW: Check for non-sponsor companies
            if self._is_non_sponsor_company(domain):
                return False
            
            return True
            
        except Exception as e:
            logger.warning(f"Failed to validate company legitimacy for {domain}: {e}")
            return False
    
    def _has_corporate_website_structure(self, url: str, domain: str) -> bool:
        """Check if website has corporate structure - MUCH STRICTER"""
        try:
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SponsorTrail/1.0)'
            })
            
            if response.status_code != 200:
                return False
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for STRONG corporate indicators - not just basic ones
            strong_corporate_indicators = [
                'investor', 'partnership', 'media kit', 'press kit', 'advertising',
                'sponsor', 'partners', 'business development', 'enterprise',
                'b2b', 'corporate', 'solutions', 'products', 'services'
            ]
            
            # Check for navigation links
            nav_links = soup.find_all('a', href=True)
            nav_texts = [link.get_text().lower() for link in nav_links]
            
            strong_corporate_count = sum(1 for indicator in strong_corporate_indicators 
                                      if any(indicator in text for text in nav_texts))
            
            # Require at least 4 strong indicators
            return strong_corporate_count >= 4
            
        except Exception as e:
            logger.debug(f"Failed to check corporate structure for {domain}: {e}")
            return False
    
    def _has_business_indicators(self, url: str, domain: str) -> bool:
        """Check for business/partnership indicators - MUCH STRICTER"""
        try:
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SponsorTrail/1.0)'
            })
            
            soup = BeautifulSoup(response.text, 'html.parser')
            text_content = soup.get_text().lower()
            
            # STRONG business indicators - not generic ones
            strong_business_indicators = [
                'partnership program', 'advertising opportunities', 'sponsor opportunities',
                'media kit', 'press kit', 'business development', 'enterprise solutions',
                'b2b', 'corporate partnerships', 'advertising rates', 'sponsorship packages',
                'partner with us', 'advertise with us', 'sponsor us'
            ]
            
            indicator_count = sum(1 for indicator in strong_business_indicators 
                                if indicator in text_content)
            
            # Require at least 3 strong indicators
            return indicator_count >= 3
            
        except Exception as e:
            logger.debug(f"Failed to check business indicators for {domain}: {e}")
            return False
    
    def _extract_company_info(self, url: str, domain: str) -> Optional[Dict]:
        """Extract company information from website"""
        try:
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SponsorTrail/1.0)'
            })
            
            if response.status_code != 200:
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract company name
            company_name = self._extract_company_name(soup, domain)
            
            # Extract tags/categories
            tags = self._extract_company_tags(soup)
            
            # Estimate subscriber count (placeholder logic)
            subscriber_count = self._estimate_subscriber_count(soup, domain)
            
            return {
                'name': company_name,
                'tags': tags,
                'subscriber_count': subscriber_count,
                'subscriber_reasoning': 'Estimated based on website analysis',
                'enrichment_notes': f'Extracted from {domain}'
            }
            
        except Exception as e:
            logger.warning(f"Failed to extract company info for {domain}: {e}")
            return None
    
    def _extract_company_name(self, soup: BeautifulSoup, domain: str) -> str:
        """Extract company name from website"""
        # Try various methods to get company name
        selectors = [
            'h1', 'title', '.company-name', '.brand', '.logo',
            '[class*="company"]', '[class*="brand"]'
        ]
        
        for selector in selectors:
            elements = soup.select(selector)
            for element in elements:
                text = element.get_text().strip()
                if text and len(text) < 100:  # Reasonable company name length
                    return text
        
        # Fallback to domain
        return domain.replace('.com', '').replace('.', ' ').title()
    
    def _extract_company_tags(self, soup: BeautifulSoup) -> List[str]:
        """Extract company tags/categories"""
        tags = []
        
        # Look for meta keywords
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        if meta_keywords:
            keywords = meta_keywords.get('content', '').split(',')
            tags.extend([kw.strip() for kw in keywords if kw.strip()])
        
        # Look for common industry terms
        text_content = soup.get_text().lower()
        industry_terms = [
            'saas', 'software', 'technology', 'fintech', 'healthtech',
            'ecommerce', 'marketing', 'analytics', 'data', 'ai', 'ml',
            'startup', 'enterprise', 'cloud', 'security', 'productivity'
        ]
        
        for term in industry_terms:
            if term in text_content:
                tags.append(term)
        
        return list(set(tags))[:10]  # Limit to 10 tags
    
    def _estimate_subscriber_count(self, soup: BeautifulSoup, domain: str) -> int:
        """Estimate subscriber count (placeholder implementation)"""
        # This is a placeholder - in a real implementation, you might:
        # - Look for subscriber count mentions
        # - Use external APIs
        # - Analyze social media followers
        # - Use company size indicators
        
        # For now, return a default estimate
        return 1000
    
    def _find_business_contact(self, url: str, domain: str) -> Dict:
        """Find business contact information"""
        try:
            # Try to find contact page
            contact_urls = [
                f"https://{domain}/contact",
                f"https://{domain}/partnerships",
                f"https://{domain}/advertising",
                f"https://{domain}/media-kit",
                f"https://{domain}/about"
            ]
            
            for contact_url in contact_urls:
                try:
                    response = requests.get(contact_url, timeout=5, headers={
                        'User-Agent': 'Mozilla/5.0 (compatible; SponsorTrail/1.0)'
                    })
                    
                    if response.status_code == 200:
                        contact_info = self._extract_contact_from_page(response.text, contact_url)
                        if contact_info['contact']:
                            return contact_info
                except:
                    continue
            
            return {'contact': '', 'method': 'none'}
            
        except Exception as e:
            logger.debug(f"Failed to find business contact for {domain}: {e}")
            return {'contact': '', 'method': 'none'}
    
    def _extract_contact_from_page(self, html_content: str, url: str) -> Dict:
        """Extract contact information from a page"""
        soup = BeautifulSoup(html_content, 'html.parser')
        text_content = soup.get_text().lower()
        
        # Look for business email patterns
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, html_content)
        
        for email in emails:
            email_lower = email.lower()
            for pattern in BUSINESS_EMAIL_PATTERNS:
                if pattern in email_lower:
                    return {
                        'contact': email,
                        'method': 'email'
                    }
        
        # Check if it's a partnerships/advertising page
        if any(term in text_content for term in ['partnership', 'advertising', 'sponsor', 'media kit']):
            return {
                'contact': url,
                'method': 'partner-page'
            }
        
        return {'contact': '', 'method': 'none'}
    
    def _calculate_confidence(self, link: str, context: str, evidence: str, 
                           company_info: Dict, contact_info: Dict) -> float:
        """Calculate confidence score for sponsor - MUCH MORE CONSERVATIVE"""
        score = 0.0
        
        # Evidence quality (50% weight) - MUCH STRICTER
        if evidence:
            evidence_parts = evidence.split('|')
            # Require multiple pieces of evidence
            if len(evidence_parts) >= 3:
                evidence_score = 0.9
            elif len(evidence_parts) >= 2:
                evidence_score = 0.6
            else:
                evidence_score = 0.2
            score += evidence_score * 0.5
        else:
            score += 0.0  # No evidence = no confidence
        
        # Context quality (30% weight) - MUCH STRICTER
        context_upper = context.upper()
        strong_sponsor_indicators = ['SPONSORED BY', 'BROUGHT TO YOU BY', 'PRESENTED BY', 'PAID FOR BY']
        payment_indicators = ['PAID', 'SPONSORSHIP', 'ADVERTISING', 'PARTNERSHIP']
        
        strong_count = sum(1 for indicator in strong_sponsor_indicators 
                          if indicator in context_upper)
        payment_count = sum(1 for indicator in payment_indicators 
                          if indicator in context_upper)
        
        if strong_count >= 2 and payment_count >= 2:
            context_score = 0.9
        elif strong_count >= 1 and payment_count >= 1:
            context_score = 0.6
        else:
            context_score = 0.2
        
        score += context_score * 0.3
        
        # Company legitimacy (15% weight) - MUCH STRICTER
        if (company_info.get('name') and company_info.get('tags') and 
            len(company_info.get('tags', [])) >= 2):
            company_score = 0.8
        elif company_info.get('name'):
            company_score = 0.4
        else:
            company_score = 0.0
        score += company_score * 0.15
        
        # Contact availability (5% weight) - REDUCED WEIGHT
        if contact_info.get('contact') and contact_info.get('method') != 'none':
            contact_score = 1.0
        else:
            contact_score = 0.0
        score += contact_score * 0.05
        
        # MUCH MORE CONSERVATIVE: Cap at 85% even for perfect cases
        return min(score, 0.85)
    
    def _offers_sponsorships(self, url: str, domain: str) -> bool:
        """Check if company actually offers sponsorships/advertising"""
        try:
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SponsorTrail/1.0)'
            })
            
            soup = BeautifulSoup(response.text, 'html.parser')
            text_content = soup.get_text().lower()
            
            # Look for explicit sponsorship/advertising offerings
            sponsorship_indicators = [
                'advertising opportunities', 'sponsor opportunities', 'partnership program',
                'advertise with us', 'sponsor us', 'media kit', 'advertising rates',
                'sponsorship packages', 'partner with us', 'business development',
                'advertising policy', 'sponsor policy', 'partnership opportunities'
            ]
            
            indicator_count = sum(1 for indicator in sponsorship_indicators 
                                if indicator in text_content)
            
            # Must have at least 2 sponsorship indicators
            return indicator_count >= 2
            
        except Exception as e:
            logger.debug(f"Failed to check sponsorship offerings for {domain}: {e}")
            return False
    
    def _is_product_service_company(self, url: str, domain: str) -> bool:
        """Check if it's a product/service company vs content site"""
        try:
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; SponsorTrail/1.0)'
            })
            
            soup = BeautifulSoup(response.text, 'html.parser')
            text_content = soup.get_text().lower()
            
            # Product/service indicators
            product_indicators = [
                'product', 'service', 'solution', 'platform', 'software', 'tool',
                'app', 'api', 'saas', 'enterprise', 'business', 'professional'
            ]
            
            # Content site indicators (exclude these)
            content_indicators = [
                'blog', 'article', 'news', 'post', 'story', 'journalism',
                'media', 'publishing', 'content', 'editorial', 'reporting'
            ]
            
            product_count = sum(1 for indicator in product_indicators 
                              if indicator in text_content)
            content_count = sum(1 for indicator in content_indicators 
                              if indicator in text_content)
            
            # Must have more product indicators than content indicators
            return product_count > content_count and product_count >= 3
            
        except Exception as e:
            logger.debug(f"Failed to check product/service company for {domain}: {e}")
            return False
    
    def _is_non_sponsor_company(self, domain: str) -> bool:
        """Check if company is in non-sponsor list"""
        domain_lower = domain.lower()
        return any(company in domain_lower for company in NON_SPONSOR_COMPANIES)
    
    def _has_payment_sponsorship_context(self, context: str, evidence: str) -> bool:
        """Validate that context indicates actual payment/sponsorship"""
        context_upper = context.upper()
        evidence_upper = evidence.upper()
        
        # Strong payment indicators
        payment_indicators = [
            'PAID', 'SPONSORSHIP', 'ADVERTISING', 'PARTNERSHIP', 'PROMOTION',
            'PAID FOR BY', 'SPONSORED BY', 'BROUGHT TO YOU BY', 'PRESENTED BY'
        ]
        
        # Count payment indicators in context and evidence
        context_payment_count = sum(1 for indicator in payment_indicators 
                                  if indicator in context_upper)
        evidence_payment_count = sum(1 for indicator in payment_indicators 
                                   if indicator in evidence_upper)
        
        # Must have at least 3 payment indicators total
        total_payment_count = context_payment_count + evidence_payment_count
        return total_payment_count >= 3
    
    def gpt_analyze_sponsor(self, sponsor_data: Dict) -> Dict:
        """Use GPT to analyze sponsor data (if available)"""
        if not self.openai_client:
            return sponsor_data
        
        try:
            prompt = f"""
            Analyze this potential newsletter sponsor with extreme precision. 
            Only confirm as a legitimate sponsor if there is clear evidence of paid placement.
            
            Sponsor Data:
            - Name: {sponsor_data.get('sponsorName', '')}
            - Domain: {sponsor_data.get('rootDomain', '')}
            - Evidence: {sponsor_data.get('sponsorshipEvidence', '')}
            - Context: {sponsor_data.get('sourceContext', '')[:200]}
            
            Requirements:
            1. Is this clearly a paid newsletter sponsorship?
            2. Is the company legitimate and B2B-focused?
            3. Is there explicit evidence of sponsorship payment?
            
            Respond with JSON:
            {{
                "is_legitimate_sponsor": boolean,
                "confidence": float (0.0-0.95),
                "reasoning": "string",
                "recommended_status": "complete|manual_review_required|reject"
            }}
            """
            
            response = self.openai_client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.1
            )
            
            result = response.choices[0].message.content
            # Parse JSON response (simplified)
            if '"is_legitimate_sponsor": true' in result:
                sponsor_data['analysisStatus'] = 'complete'
                sponsor_data['confidence'] = min(sponsor_data.get('confidence', 0.8) + 0.1, 0.95)
            elif 'manual_review' in result:
                sponsor_data['analysisStatus'] = 'manual_review_required'
            
            return sponsor_data
            
        except Exception as e:
            logger.warning(f"GPT analysis failed: {e}")
            return sponsor_data
