import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';

interface Sponsor {
    sponsorName: string;
    sponsorLink: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    dateAdded: string;
}

interface PaidSponsorTableProps {
    onError?: (error: string) => void;
    activeFilter: string;
}

const PaidSponsorTable: React.FC<PaidSponsorTableProps> = ({ onError, activeFilter }) => {
    const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
    const [displayedSponsors, setDisplayedSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const ITEMS_PER_PAGE = 50;

    // Fetch all sponsors initially
    const fetchAllSponsors = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${config.backendUrl}/sponsors`, {
                page: 1,
                limit: 1000 // Fetch all sponsors
            });
            
            setAllSponsors(response.data);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sponsors';
            setError(errorMessage);
            if (onError) onError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        fetchAllSponsors();
    }, [fetchAllSponsors]);

    // Filter sponsors based on active filter
    const filteredSponsors = activeFilter === 'all' 
        ? allSponsors 
        : allSponsors.filter(sponsor => 
            sponsor.tags.some(tag => tag.toLowerCase() === activeFilter.toLowerCase())
        );

    // Update displayed sponsors when filter changes or page changes
    useEffect(() => {
        const startIndex = 0;
        const endIndex = page * ITEMS_PER_PAGE;
        setDisplayedSponsors(filteredSponsors.slice(startIndex, endIndex));
    }, [filteredSponsors, page, activeFilter]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && displayedSponsors.length < filteredSponsors.length) {
            setPage(prev => prev + 1);
        }
    }, [loading, displayedSponsors.length, filteredSponsors.length]);

    const getTagClass = (tag: string) => {
        const tagClass = tag.toLowerCase().replace(/\s+/g, '-');
        return `sponsor-table__tag sponsor-table__tag--${tagClass}`;
    };

    if (error) {
        return <div className="sponsor-table__error">{error}</div>;
    }

    return (
        <div className="sponsor-table" onScroll={handleScroll} style={{ maxHeight: '800px', overflowY: 'auto' }}>
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
                    {displayedSponsors.map((sponsor, index) => (
                        <tr key={`${sponsor.sponsorName}-${index}`}>
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
                            <td>
                                {sponsor.businessContact.includes('@') ? (
                                    <a 
                                        href={`mailto:${sponsor.businessContact}`}
                                        className="sponsor-table__link"
                                    >
                                        {sponsor.businessContact}
                                    </a>
                                ) : (
                                    <a 
                                        href={sponsor.businessContact}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="sponsor-table__link"
                                    >
                                        {sponsor.businessContact}
                                        <FontAwesomeIcon 
                                            icon={faExternalLink} 
                                            className="sponsor-table__link-icon" 
                                        />
                                    </a>
                                )}
                            </td>
                            <td>{sponsor.subscriberCount.toLocaleString()}</td>
                            <td>
                                <div className="sponsor-table__tags">
                                    {sponsor.tags.map((tag, tagIndex) => (
                                        <span key={tagIndex} className={getTagClass(tag)}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td>{new Date(sponsor.dateAdded).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {loading && <div className="sponsor-table__loading">Loading sponsors...</div>}
            {!loading && displayedSponsors.length < filteredSponsors.length && (
                <div className="sponsor-table__loading">Scroll to load more...</div>
            )}
        </div>
    );
};

export default PaidSponsorTable; 