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
        """Check if email has strong sponsor indicators - MUCH STRICTER"""
        subject = email_data.get('subject', '').upper()
        body = email_data.get('body', '').upper()
        
        # Check for explicit sponsor markers
        sponsor_count = 0
        for marker in SPONSOR_MARKERS:
            if marker in subject or marker in body:
                sponsor_count += 1
        
        # Require minimum sponsor indicators - MUCH HIGHER
        if sponsor_count < MIN_SPONSOR_INDICATORS:
            logger.debug(f"Email has only {sponsor_count} sponsor indicators, minimum required: {MIN_SPONSOR_INDICATORS}")
            return False
        
        # Additional check: require explicit sponsorship language in context
        if not self._has_explicit_sponsorship_context(body):
            logger.debug("Email lacks explicit sponsorship context")
            return False
        
        logger.info(f"Email has {sponsor_count} sponsor indicators and explicit context - processing")
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
        
        sponsor_sections = []
        
        # Split body into sections and analyze each
        sections = self._split_into_sections(body)
        
        for i, section in enumerate(sections):
            if self._is_sponsor_section(section):
                links = self._extract_links_from_section(section)
                if links:
                    sponsor_sections.append({
                        'section_text': section,
                        'section_index': i,
                        'links': links,
                        'sponsor_evidence': self._extract_sponsor_evidence(section)
                    })
        
        logger.info(f"Found {len(sponsor_sections)} potential sponsor sections")
        return sponsor_sections
    
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
        """Check if section contains sponsor content - MUCH STRICTER"""
        section_upper = section.upper()
        
        # Check for sponsor markers - require many more
        sponsor_marker_count = 0
        for marker in SPONSOR_MARKERS:
            if marker in section_upper:
                sponsor_marker_count += 1
        
        # Check for links (sponsors usually have links)
        link_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        links = re.findall(link_pattern, section)
        
        # Must have many sponsor markers AND links AND explicit sponsorship context
        if sponsor_marker_count < MIN_SPONSOR_SECTION_MARKERS or len(links) == 0:
            return False
        
        # Additional validation: must have explicit sponsorship language
        explicit_phrases = [
            'SPONSORED BY',
            'BROUGHT TO YOU BY',
            'PRESENTED BY',
            'PARTNERED WITH',
            'IN PARTNERSHIP WITH',
            'PAID FOR BY',
            'PROMOTED BY'
        ]
        
        explicit_count = sum(1 for phrase in explicit_phrases if phrase in section_upper)
        if explicit_count < 2:
            return False
        
        # Check for payment/sponsorship indicators
        payment_indicators = [
            'PAID', 'SPONSORSHIP', 'ADVERTISING', 'PARTNERSHIP', 'PROMOTION'
        ]
        payment_count = sum(1 for indicator in payment_indicators if indicator in section_upper)
        
        return payment_count >= 2
    
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
