import imaplib
import email
import logging
import re
from typing import List, Dict, Optional, Tuple
from bs4 import BeautifulSoup
from config import (
    EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FOLDER,
    SPONSOR_MARKERS, MAX_EMAILS_PER_RUN, MIN_SPONSOR_INDICATORS, MIN_SPONSOR_SECTION_MARKERS
)

logger = logging.getLogger(__name__)

class EmailProcessor:
    def __init__(self):
        self.mail = None
        self.connect()
    
    def connect(self):
        """Connect to email server"""
        try:
            self.mail = imaplib.IMAP4_SSL(EMAIL_HOST, EMAIL_PORT)
            self.mail.login(EMAIL_USER, EMAIL_PASSWORD)
            self.mail.select(EMAIL_FOLDER)
            logger.info("Connected to email server")
        except Exception as e:
            logger.error(f"Failed to connect to email server: {e}")
            raise
    
    def disconnect(self):
        """Disconnect from email server"""
        if self.mail:
            self.mail.close()
            self.mail.logout()
            logger.info("Disconnected from email server")
    
    def get_recent_emails(self, limit: int = MAX_EMAILS_PER_RUN) -> List[Dict]:
        """Get recent emails from inbox"""
        try:
            if not self.mail:
                logger.error("Email connection not established")
                return []
                
            # Search for unread emails
            status, messages = self.mail.search(None, 'UNSEEN')
            if status != 'OK':
                logger.error("Failed to search emails")
                return []
            
            email_ids = messages[0].split()
            recent_ids = email_ids[-limit:] if len(email_ids) > limit else email_ids
            
            emails = []
            for email_id in recent_ids:
                try:
                    email_data = self._fetch_email(email_id)
                    if email_data:
                        emails.append(email_data)
                except Exception as e:
                    logger.warning(f"Failed to fetch email {email_id}: {e}")
                    continue
            
            logger.info(f"Retrieved {len(emails)} recent emails")
            return emails
            
        except Exception as e:
            logger.error(f"Failed to get recent emails: {e}")
            return []
    
    def _fetch_email(self, email_id: bytes) -> Optional[Dict]:
        """Fetch individual email data"""
        try:
            status, msg_data = self.mail.fetch(email_id, '(RFC822)')
            if status != 'OK':
                return None
            
            raw_email = msg_data[0][1]
            email_message = email.message_from_bytes(raw_email)
            
            # Extract email components
            subject = self._decode_header(email_message.get('Subject', ''))
            sender = self._decode_header(email_message.get('From', ''))
            date = email_message.get('Date', '')
            
            # Get email body
            body = self._extract_body(email_message)
            
            return {
                'id': email_id.decode(),
                'subject': subject,
                'sender': sender,
                'date': date,
                'body': body,
                'raw_message': email_message
            }
            
        except Exception as e:
            logger.warning(f"Failed to fetch email {email_id}: {e}")
            return None
    
    def _decode_header(self, header: str) -> str:
        """Decode email header"""
        try:
            decoded_parts = email.header.decode_header(header)
            decoded_string = ""
            for part, encoding in decoded_parts:
                if isinstance(part, bytes):
                    if encoding:
                        decoded_string += part.decode(encoding)
                    else:
                        decoded_string += part.decode('utf-8', errors='ignore')
                else:
                    decoded_string += part
            return decoded_string
        except Exception as e:
            logger.warning(f"Failed to decode header: {e}")
            return header
    
    def _extract_body(self, email_message) -> str:
        """Extract email body text"""
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    body += part.get_payload(decode=True).decode('utf-8', errors='ignore')
                elif content_type == "text/html":
                    html_body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    # Convert HTML to text
                    soup = BeautifulSoup(html_body, 'html.parser')
                    body += soup.get_text()
        else:
            content_type = email_message.get_content_type()
            if content_type == "text/plain":
                body = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
            elif content_type == "text/html":
                html_body = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
                soup = BeautifulSoup(html_body, 'html.parser')
                body = soup.get_text()
        
        return body
    
    def has_sponsor_indicators(self, email_data: Dict) -> bool:
        """Check if email has sponsor indicators - much more practical"""
        subject = email_data.get('subject', '').upper()
        body = email_data.get('body', '').upper()
        
        # Check for sponsor markers
        sponsor_count = 0
        for marker in SPONSOR_MARKERS:
            if marker in subject or marker in body:
                sponsor_count += 1
        
        # Much more lenient threshold
        if sponsor_count < MIN_SPONSOR_INDICATORS:
            logger.debug(f"Email has only {sponsor_count} sponsor indicators, minimum required: {MIN_SPONSOR_INDICATORS}")
            return False
        
        logger.info(f"Email has {sponsor_count} sponsor indicators - processing")
        return True
    
    def _has_explicit_sponsorship_context(self, body: str) -> bool:
        """Check for explicit sponsorship context - not just mentions of 'sponsor'"""
        # Look for clear sponsorship phrases, not just mentions
        explicit_phrases = [
            'SPONSORED BY',
            'BROUGHT TO YOU BY',
            'PRESENTED BY',
            'PARTNERED WITH',
            'IN PARTNERSHIP WITH',
            'PAID FOR BY',
            'PROMOTED BY'
        ]
        
        # Must have at least 2 explicit phrases
        explicit_count = sum(1 for phrase in explicit_phrases if phrase in body)
        return explicit_count >= 2
    
    def extract_sponsor_sections(self, email_data: Dict) -> List[Dict]:
        """Extract potential sponsor sections from email"""
        body = email_data.get('body', '')
        subject = email_data.get('subject', '')
        raw_message = email_data.get('raw_message')
        
        sponsor_sections = []
        
        # First try HTML analysis if available
        if raw_message:
            html_sections = self._extract_sponsor_section_html(raw_message)
            for text, soup in html_sections:
                links = self._extract_links_from_section(text)
                if links:  # Only add if we found links
                    sponsor_sections.append({
                        'section_text': text,
                        'section_index': len(sponsor_sections),
                        'links': links,
                        'sponsor_evidence': self._extract_sponsor_evidence(text),
                        'source': 'html_analysis'
                    })
        
        # Fallback to text-based analysis
        if not sponsor_sections:
            sections = self._split_into_sections(body)
            
            for i, section in enumerate(sections):
                if self._is_sponsor_section(section):
                    links = self._extract_links_from_section(section)
                    sponsor_sections.append({
                        'section_text': section,
                        'section_index': i,
                        'links': links,
                        'sponsor_evidence': self._extract_sponsor_evidence(section),
                        'source': 'text_analysis'
                    })
        
        logger.info(f"Found {len(sponsor_sections)} potential sponsor sections")
        return sponsor_sections
    
    def _extract_sponsor_section_html(self, email_message) -> List[Tuple[str, BeautifulSoup]]:
        """Extract sponsor sections using HTML structure"""
        sponsor_sections = []
        
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/html":
                    html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Look for tables/divs with sponsor indicators
                    sponsor_containers = soup.find_all(['table', 'div'], 
                        class_=re.compile(r'sponsor|partner|ad|promoted', re.I))
                    
                    for container in sponsor_containers:
                        text = container.get_text()
                        if self._has_sponsor_keywords(text):
                            sponsor_sections.append((text, container))
                    
                    # Also check for explicit sponsor markers in headings
                    for heading in soup.find_all(['h1', 'h2', 'h3', 'h4']):
                        heading_text = heading.get_text().upper()
                        if any(marker in heading_text for marker in ['SPONSORED', 'PARTNER', 'BROUGHT TO YOU']):
                            # Get the section after this heading
                            section = heading.find_next(['div', 'table', 'section'])
                            if section:
                                sponsor_sections.append((section.get_text(), section))
        
        return sponsor_sections
    
    def _has_sponsor_keywords(self, text: str) -> bool:
        """Check if text contains sponsor keywords"""
        text_upper = text.upper()
        sponsor_marker_count = 0
        for marker in SPONSOR_MARKERS:
            if marker in text_upper:
                sponsor_marker_count += 1
        
        return sponsor_marker_count >= MIN_SPONSOR_SECTION_MARKERS
    
    def _split_into_sections(self, text: str) -> List[str]:
        """Split text into logical sections"""
        # Split by common newsletter section markers
        section_markers = [
            r'\n\s*---+\s*\n',
            r'\n\s*===+\s*\n',
            r'\n\s*###+\s*\n',
            r'\n\s*SPONSORED?\s*BY\s*\n',
            r'\n\s*BROUGHT\s+TO\s+YOU\s+BY\s*\n',
            r'\n\s*PRESENTED\s+BY\s*\n',
            r'\n\s*PARTNER\s+CONTENT\s*\n',
            r'\n\s*ADVERTISEMENT\s*\n'
        ]
        
        sections = [text]
        for marker in section_markers:
            new_sections = []
            for section in sections:
                new_sections.extend(re.split(marker, section, flags=re.IGNORECASE))
            sections = new_sections
        
        # Filter out empty sections
        return [s.strip() for s in sections if s.strip()]
    
    def _is_sponsor_section(self, section: str) -> bool:
        """Check if section contains sponsor content - much more practical"""
        section_upper = section.upper()
        
        # Check for sponsor markers
        sponsor_marker_count = 0
        for marker in SPONSOR_MARKERS:
            if marker in section_upper:
                sponsor_marker_count += 1
        
        # Much more lenient - just need minimum markers
        if sponsor_marker_count < MIN_SPONSOR_SECTION_MARKERS:
            return False
        
        # Check for links (sponsors usually have links) - but don't require them
        link_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        links = re.findall(link_pattern, section)
        
        # If we have links, that's a good sign
        has_links = len(links) > 0
        
        # If we have enough sponsor markers, that's sufficient
        # Links are a bonus but not required
        return sponsor_marker_count >= MIN_SPONSOR_SECTION_MARKERS
    
    def _extract_links_from_section(self, section: str) -> List[str]:
        """Extract all links from a section"""
        link_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        links = re.findall(link_pattern, section)
        
        # Clean and validate links
        clean_links = []
        for link in links:
            # Remove trailing punctuation
            clean_link = re.sub(r'[.,;:!?]+$', '', link)
            if self._is_valid_url(clean_link):
                clean_links.append(clean_link)
        
        return clean_links
    
    def _is_valid_url(self, url: str) -> bool:
        """Basic URL validation"""
        try:
            import validators
            return validators.url(url)
        except:
            # Fallback validation
            return url.startswith(('http://', 'https://')) and len(url) > 10
    
    def _extract_sponsor_evidence(self, section: str) -> str:
        """Extract evidence of sponsorship from section"""
        evidence_parts = []
        
        # Find sentences containing sponsor markers
        sentences = re.split(r'[.!?]+', section)
        for sentence in sentences:
            sentence_upper = sentence.upper()
            for marker in SPONSOR_MARKERS:
                if marker in sentence_upper:
                    evidence_parts.append(sentence.strip())
                    break
        
        return ' | '.join(evidence_parts[:3])  # Limit to 3 pieces of evidence
    
    def mark_email_as_read(self, email_id: str) -> bool:
        """Mark email as read"""
        try:
            self.mail.store(email_id, '+FLAGS', '\\Seen')
            logger.debug(f"Marked email {email_id} as read")
            return True
        except Exception as e:
            logger.warning(f"Failed to mark email {email_id} as read: {e}")
            return False
    
    def calculate_confidence_score(self, email_data: Dict, sponsor_sections: List[Dict]) -> float:
        """Calculate confidence score for sponsor detection (0.0 to 1.0)"""
        if not sponsor_sections:
            return 0.0
        
        body = email_data.get('body', '').upper()
        subject = email_data.get('subject', '').upper()
        
        confidence_factors = []
        
        # Factor 1: Explicit sponsorship language (0.4 weight)
        explicit_phrases = [
            'SPONSORED BY', 'BROUGHT TO YOU BY', 'PRESENTED BY',
            'PARTNERED WITH', 'IN PARTNERSHIP WITH', 'PAID FOR BY',
            'PROMOTED BY', 'ADVERTISEMENT', 'SPONSORED CONTENT'
        ]
        explicit_count = sum(1 for phrase in explicit_phrases if phrase in body or phrase in subject)
        explicit_score = min(explicit_count * 0.1, 0.4)  # Max 0.4
        confidence_factors.append(explicit_score)
        
        # Factor 2: Clickable company links (0.3 weight)
        total_links = sum(len(section.get('links', [])) for section in sponsor_sections)
        link_score = min(total_links * 0.05, 0.3)  # Max 0.3
        confidence_factors.append(link_score)
        
        # Factor 3: Tracking URLs and promotional CTAs (0.2 weight)
        tracking_indicators = [
            'UTM_SOURCE', 'UTM_MEDIUM', 'UTM_CAMPAIGN', 'DISCOUNT CODE',
            'PROMO CODE', 'COUPON CODE', 'TRY IT FREE', 'GET STARTED AT',
            'USE CODE', 'SPECIAL PRICING', 'EXCLUSIVE OFFER'
        ]
        tracking_count = sum(1 for indicator in tracking_indicators if indicator in body)
        tracking_score = min(tracking_count * 0.05, 0.2)  # Max 0.2
        confidence_factors.append(tracking_score)
        
        # Factor 4: Sponsor section quality (0.1 weight)
        section_quality = min(len(sponsor_sections) * 0.02, 0.1)  # Max 0.1
        confidence_factors.append(section_quality)
        
        total_confidence = sum(confidence_factors)
        return min(total_confidence, 1.0)  # Cap at 1.0
    
    def determine_processing_status(self, confidence_score: float) -> str:
        """Determine processing status based on confidence score"""
        if confidence_score >= 0.8:
            return 'complete'  # High confidence - auto-approve
        elif confidence_score >= 0.5:
            return 'needs_review'  # Medium confidence - manual review
        else:
            return 'rejected'  # Low confidence - don't add to database
    
    def process_sponsor_sections_with_confidence(self, email_data: Dict) -> List[Dict]:
        """Process sponsor sections with confidence scoring and status assignment"""
        sponsor_sections = self.extract_sponsor_sections(email_data)
        
        if not sponsor_sections:
            return []
        
        # Calculate confidence score
        confidence_score = self.calculate_confidence_score(email_data, sponsor_sections)
        
        # Determine processing status
        status = self.determine_processing_status(confidence_score)
        
        # Add confidence and status to each section
        processed_sections = []
        for section in sponsor_sections:
            processed_section = section.copy()
            processed_section['confidence_score'] = confidence_score
            processed_section['processing_status'] = status
            processed_sections.append(processed_section)
        
        logger.info(f"Processed {len(processed_sections)} sponsor sections with confidence {confidence_score:.2f}, status: {status}")
        return processed_sections

    def get_newsletter_name(self, email_data: Dict) -> str:
        """Extract newsletter name from email"""
        sender = email_data.get('sender', '')
        subject = email_data.get('subject', '')
        
        # Try to extract from sender
        if '<' in sender and '>' in sender:
            name_match = re.search(r'<(.+?)>', sender)
            if name_match:
                return name_match.group(1)
        
        # Try to extract from subject (common patterns)
        subject_patterns = [
            r'^(.+?)\s*Newsletter',
            r'^(.+?)\s*Weekly',
            r'^(.+?)\s*Daily',
            r'^(.+?)\s*Update'
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Fallback to sender
        return sender.split('<')[0].strip() if '<' in sender else sender
