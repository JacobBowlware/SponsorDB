import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink, faHandshake, faEnvelope, faLink } from '@fortawesome/free-solid-svg-icons';

interface Sponsor {
    sponsorName: string;
    sponsorLink: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    sponsorEmail?: string;
    sponsorApplication?: string;
    businessContact?: string;
    contactMethod: 'email' | 'application' | 'both' | 'none';
    dateAdded: string;
    // Affiliate program fields
    isAffiliateProgram?: boolean;
    affiliateSignupLink?: string;
    commissionInfo?: string;
    interestedUsers?: string[];
}

interface SponsorTableProps {
    sponsors: Sponsor[];
    isSample?: boolean;
}

const SponsorTable: React.FC<SponsorTableProps> = ({ sponsors, isSample = false }) => {
    // Check if we're on mobile
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Helper function to display contact information
    const getContactDisplay = (sponsor: Sponsor) => {
        const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim();
        const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim();
        
        if (hasEmail && hasApplication) {
            return (
                <div className="contact-both">
                    <div className="contact-item">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <span>{sponsor.sponsorEmail}</span>
                    </div>
                    <div className="contact-item">
                        <FontAwesomeIcon icon={faLink} />
                        <a href={sponsor.sponsorApplication} target="_blank" rel="noopener noreferrer">
                            Application
                        </a>
                    </div>
                </div>
            );
        } else if (hasEmail) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span>{sponsor.sponsorEmail}</span>
                </div>
            );
        } else if (hasApplication) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faLink} />
                    <a href={sponsor.sponsorApplication} target="_blank" rel="noopener noreferrer">
                        Application
                    </a>
                </div>
            );
        } else {
            return <span className="no-contact">No contact</span>;
        }
    };

    // Mobile view - Sponsor cards
    if (isMobile) {
        return (
            <div className="mobile-sponsors-grid">
                {sponsors.map((sponsor, index) => (
                    <div key={index} className="sponsor-card">
                        <div className="sponsor-card-header">
                            <div>
                                <h3 className="sponsor-name">{sponsor.sponsorName}</h3>
                                <p className="sponsor-domain">{sponsor.sponsorLink.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
                            </div>
                        </div>
                        
                        <div className="sponsor-tags">
                            {sponsor.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="sponsor-tag">{tag}</span>
                            ))}
                        </div>
                        
                        <div className="sponsor-details">
                            <div className="sponsor-detail">
                                <span className="sponsor-detail-label">Newsletter</span>
                                <span className="sponsor-detail-value">{sponsor.newsletterSponsored}</span>
                            </div>
                            <div className="sponsor-detail">
                                <span className="sponsor-detail-label">Audience</span>
                                <span className="sponsor-detail-value">{sponsor.subscriberCount.toLocaleString()}</span>
                            </div>
                            <div className="sponsor-detail">
                                <span className="sponsor-detail-label">Contact</span>
                                <div className="sponsor-detail-value">
                                    {getContactDisplay(sponsor)}
                                </div>
                            </div>
                            <div className="sponsor-detail">
                                <span className="sponsor-detail-label">Added</span>
                                <span className="sponsor-detail-value">{sponsor.dateAdded}</span>
                            </div>
                        </div>
                        
                        <div className="sponsor-actions">
                            <button 
                                className="sponsor-action-btn sponsor-view-btn"
                                onClick={() => window.open(sponsor.sponsorLink, '_blank')}
                            >
                                <FontAwesomeIcon icon={faExternalLink} />
                                View
                            </button>
                            {(sponsor.sponsorEmail || sponsor.sponsorApplication) && (
                                <button 
                                    className="sponsor-action-btn sponsor-apply-btn"
                                    onClick={() => {
                                        if (sponsor.sponsorEmail) {
                                            window.open(`mailto:${sponsor.sponsorEmail}`);
                                        } else if (sponsor.sponsorApplication) {
                                            window.open(sponsor.sponsorApplication, '_blank');
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faHandshake} />
                                    Apply
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isSample && (
                    <div className="sponsor-table__sample-note">
                        This is a sample of our database. Sign up to access the full list of 10,000+ sponsors.
                    </div>
                )}
            </div>
        );
    }

    // Desktop view - Table
    return (
        <div className="sponsor-table">
            <table>
                <thead>
                    <tr>
                        <th>Sponsor</th>
                        <th>Newsletter</th>
                        <th>Business Contact</th>
                        <th>Subscribers</th>
                        <th>Tags</th>
                        <th>Date Added</th>
                    </tr>
                </thead>
                <tbody>
                    {sponsors.map((sponsor, index) => (
                        <tr key={index}>
                            <td>
                                <a 
                                    href={sponsor.sponsorLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="sponsor-table__link"
                                >
                                    {sponsor.sponsorName}
                                    <FontAwesomeIcon 
                                        icon={faExternalLink} 
                                        className="sponsor-table__link-icon" 
                                    />
                                </a>
                            </td>
                            <td>{sponsor.newsletterSponsored}</td>
                            <td>{getContactDisplay(sponsor)}</td>
                            <td>{sponsor.subscriberCount.toLocaleString()}</td>
                            <td>
                                <div className="sponsor-table__tags">
                                    {sponsor.tags.map((tag, tagIndex) => (
                                        <span key={tagIndex} className="sponsor-table__tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td>{sponsor.dateAdded}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isSample && (
                <div className="sponsor-table__sample-note">
                    This is a sample of our database. Sign up to access the full list of 10,000+ sponsors.
                </div>
            )}
        </div>
    );
};

export default SponsorTable; 