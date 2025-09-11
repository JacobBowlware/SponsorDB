import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink, faHandshake } from '@fortawesome/free-solid-svg-icons';

interface Sponsor {
    sponsorName: string;
    sponsorLink: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    dateAdded: string;
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
                                <span className="sponsor-detail-value">{sponsor.businessContact}</span>
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
                            <button 
                                className="sponsor-action-btn sponsor-apply-btn"
                                onClick={() => window.open(`mailto:${sponsor.businessContact}`)}
                            >
                                <FontAwesomeIcon icon={faHandshake} />
                                Apply
                            </button>
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
                            <td>{sponsor.businessContact}</td>
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