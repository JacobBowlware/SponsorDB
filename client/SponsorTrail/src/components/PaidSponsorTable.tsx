import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink, faSpinner, faExclamationTriangle, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';

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

// Define category mappings
const CATEGORY_TAGS = {
    'technology': ['Technology', 'Software', 'AI', 'Productivity', 'Crypto'],
    'finance': ['Finance', 'Investing', 'Business', 'Retail', 'Ecommerce'],
    'health': ['Health', 'Mental Health', 'Beauty', 'Fashion'],
    'lifestyle': ['Lifestyle', 'Food', 'Travel', 'Sports', 'Entertainment', 'Music', 'Art'],
    'marketing': ['Marketing', 'Social', 'Affiliate'],
    'education': ['Education', 'Science', 'Politics'],
    'business': ['Business', 'Marketing', 'Ecommerce', 'Retail', 'Finance', 'Startups'],
    'all': [] // Special case for showing all sponsors
} as const;

type CategoryType = keyof typeof CATEGORY_TAGS;

const PaidSponsorTable: React.FC<PaidSponsorTableProps> = ({ onError, activeFilter }) => {
    const navigate = useNavigate();
    const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
    const [displayedSponsors, setDisplayedSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 50;
    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Fetch all sponsors initially
    const fetchAllSponsors = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const response = await axios.get(`${config.backendUrl}sponsors`, {
                headers: {
                    'x-auth-token': token
                }
            });
            setAllSponsors(response.data);
        } catch (err) {
            let errorMessage = 'Something went wrong while loading sponsors.';
            
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 401) {
                    errorMessage = 'Your session has expired. Please log in again.';
                    localStorage.removeItem('token');
                    navigate('/login');
                    return;
                } else if (err.response?.status === 404) {
                    errorMessage = 'Unable to find sponsor data. Please try again later.';
                } else if (err.response?.status === 403) {
                    errorMessage = 'You do not have access to view sponsors.';
                } else if (err.response?.status === 500) {
                    errorMessage = 'Server error. Our team has been notified.';
                } else if (!err.response) {
                    errorMessage = 'Network error. Please check your connection.';
                }
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            if (onError) onError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [onError, navigate]);

    useEffect(() => {
        fetchAllSponsors();
    }, [fetchAllSponsors]);

    const filteredSponsors = useMemo(() => {
        if (activeFilter === 'all') return allSponsors;
        
        // Split the active filter into an array of tags
        const filterTags = activeFilter.split(',').map(tag => tag.trim().toLowerCase());
        
        return allSponsors.filter(sponsor => 
            sponsor.tags?.some(tag => 
                filterTags.some(filterTag => tag.toLowerCase() === filterTag)
            )
        );
    }, [allSponsors, activeFilter]);

    const sortedSponsors = [...filteredSponsors].sort((a, b) => {
        if (sortColumn === 'subscribers') {
            return sortDirection === 'asc' ? a.subscriberCount - b.subscriberCount : b.subscriberCount - a.subscriberCount;
        } else if (sortColumn === 'date') {
            return sortDirection === 'asc' ? new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime() : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        }
        return 0;
    });

    // Update displayed sponsors when filter changes or page changes
    useEffect(() => {
        const startIndex = 0;
        const endIndex = page * ITEMS_PER_PAGE;
        const newDisplayedSponsors = sortedSponsors.slice(startIndex, endIndex);
        setDisplayedSponsors(newDisplayedSponsors);
        setHasMore(newDisplayedSponsors.length < sortedSponsors.length);
    }, [sortedSponsors, page]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        
        // Load more when user scrolls to 80% of the current content
        if (scrollHeight - scrollTop <= clientHeight * 1.2 && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [loading, hasMore]);

    const getTagClass = (tag: string) => {
        const tagClass = tag.toLowerCase().replace(/\s+/g, '-');
        return `sponsor-table__tag sponsor-table__tag--${tagClass}`;
    };

    const getSortIcon = (column: string) => {
        if (sortColumn === column) {
            return sortDirection === 'asc' ? faSortUp : faSortDown;
        }
        return faSort;
    };

    const handleSort = (column: string) => {
        if (column === sortColumn) {
            setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    if (error) {
        return (
            <div className="sponsor-table__error">
                <FontAwesomeIcon icon={faExclamationTriangle} className="sponsor-table__error-icon" />
                <p>{error}</p>
                <p className="sponsor-table__error-subtext">
                    If this issue persists, please contact support.
                </p>
                <button 
                    className="sponsor-table__error-retry"
                    onClick={() => fetchAllSponsors()}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (loading && allSponsors.length === 0) {
        return (
            <div className="sponsor-table__loading-container">
                <FontAwesomeIcon icon={faSpinner} spin className="sponsor-table__loading-icon" />
                <p>Loading sponsors...</p>
            </div>
        );
    }

    return (
        <div className="sponsor-table" onScroll={handleScroll} style={{ maxHeight: '800px', overflowY: 'auto' }}>
            <table>
                <thead>
                    <tr>
                        <th className="sponsor-table__column-header">Sponsor</th>
                        <th className="sponsor-table__column-header">Contact/Apply</th>
                        <th className="sponsor-table__column-header">Newsletter</th>
                        <th className="sponsor-table__column-header">
                            Subscribers
                            <FontAwesomeIcon 
                                icon={getSortIcon('subscribers')} 
                                className="sponsor-table__sort-icon"
                                onClick={() => handleSort('subscribers')}
                            />
                        </th>
                        <th style={{textAlign: 'left'}}>Tags</th>
                        <th className="sponsor-table__column-header">
                            Date Added
                            <FontAwesomeIcon 
                                icon={getSortIcon('date')} 
                                className="sponsor-table__sort-icon"
                                onClick={() => handleSort('date')}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {displayedSponsors.map((sponsor, index) => (
                        <tr key={`${sponsor.sponsorName || index}-${index}`}>
                            <td className="sponsor-table__row">
                                {sponsor.sponsorLink ? (
                                    <a 
                                        href={sponsor.sponsorLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="sponsor-table__link"
                                    >
                                        {sponsor.sponsorName || 'Unnamed Sponsor'}
                                    </a>
                                ) : (
                                    <span>{sponsor.sponsorName || 'Unnamed Sponsor'}</span>
                                )}
                            </td>
                            <td className="sponsor-table__row">{sponsor.businessContact ? (
                                sponsor.businessContact.includes('@') ? (
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
                                        Apply <FontAwesomeIcon 
                                            icon={faExternalLink} 
                                            className="sponsor-table__link-icon" 
                                        />
                                    </a>
                                )
                            ) : (
                                <span>N/A</span>
                            )}</td>
                            <td className="sponsor-table__row">
                                <span className="sponsor-table__newsletter">{sponsor.newsletterSponsored || 'N/A'}</span>
                            </td>
                            <td className="sponsor-table__row">{sponsor.subscriberCount ? sponsor.subscriberCount.toLocaleString() : 'N/A'}</td>
                            <td className="sponsor-table__row">
                                <div className="sponsor-table__tags">
                                    {sponsor.tags && sponsor.tags.length > 0 ? (
                                        sponsor.tags.map((tag, tagIndex) => (
                                            <span key={tagIndex} className={getTagClass(tag)}>
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="sponsor-table__tag">No tags</span>
                                    )}
                                </div>
                            </td>
                            <td className="sponsor-table__row">{sponsor.dateAdded ? new Date(sponsor.dateAdded).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {loading && allSponsors.length === 0 && (
                <div className="sponsor-table__loading-container">
                    <FontAwesomeIcon icon={faSpinner} spin className="sponsor-table__loading-icon" />
                    <p>Loading sponsors...</p>
                </div>
            )}
            {loading && allSponsors.length > 0 && (
                <div className="sponsor-table__loading">
                    <FontAwesomeIcon icon={faSpinner} spin className="sponsor-table__loading-icon" />
                    Loading more sponsors...
                </div>
            )}
            {!loading && hasMore && (
                <div className="sponsor-table__loading">
                    <span>Scroll down to load more sponsors...</span>
                    <button 
                        className="sponsor-table__load-more-btn"
                        onClick={() => setPage(prev => prev + 1)}
                    >
                        Load More
                    </button>
                </div>
            )}
            {!loading && !hasMore && displayedSponsors.length > 0 && (
                <div className="sponsor-table__loading">
                    {displayedSponsors.length} of {sortedSponsors.length} sponsors
                </div>
            )}
        </div>
    );
};

export default PaidSponsorTable; 