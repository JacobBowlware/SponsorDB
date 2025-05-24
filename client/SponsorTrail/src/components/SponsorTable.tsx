import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons';

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