import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChartLine, 
    faCheckCircle, 
    faUsers,
    faArrowTrendUp,
    faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    dateAdded: string;
    appliedBy?: string[];
    // Affiliate program fields
    isAffiliateProgram?: boolean;
    affiliateSignupLink?: string;
    commissionInfo?: string;
    interestedUsers?: string[];
}

interface SponsorAnalyticsProps {
    className?: string;
}

const SponsorAnalytics: React.FC<SponsorAnalyticsProps> = ({ className = '' }) => {
    const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            
            // Check if we're in local development
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalDev) {
                // Provide mock data for development
                const mockSponsors = [
                    {
                        _id: 'dev1',
                        sponsorName: 'TechCorp',
                        sponsorLink: 'https://techcorp.com',
                        rootDomain: 'techcorp.com',
                        tags: ['technology', 'software'],
                        newsletterSponsored: 'Tech Weekly',
                        subscriberCount: 50000,
                        businessContact: 'sponsor@techcorp.com',
                        dateAdded: new Date().toISOString(),
                        appliedBy: ['user1', 'user2', 'user3', 'user4', 'user5']
                    },
                    {
                        _id: 'dev2',
                        sponsorName: 'HealthPlus',
                        sponsorLink: 'https://healthplus.com',
                        rootDomain: 'healthplus.com',
                        tags: ['health', 'wellness'],
                        newsletterSponsored: 'Health Daily',
                        subscriberCount: 75000,
                        businessContact: 'partnerships@healthplus.com',
                        dateAdded: new Date().toISOString(),
                        appliedBy: ['user1', 'user2', 'user3']
                    },
                    {
                        _id: 'dev3',
                        sponsorName: 'EduTech',
                        sponsorLink: 'https://edutech.com',
                        rootDomain: 'edutech.com',
                        tags: ['education', 'technology'],
                        newsletterSponsored: 'Learning Weekly',
                        subscriberCount: 30000,
                        businessContact: 'sponsors@edutech.com',
                        dateAdded: new Date().toISOString(),
                        appliedBy: ['user1', 'user2']
                    }
                ];
                
                setAllSponsors(mockSponsors);
                setLoading(false);
                return;
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                setLoading(false);
                return;
            }

            const response = await axios.get(`${config.backendUrl}sponsors`, {
                headers: {
                    'x-auth-token': token
                }
            });
            
            const sponsors = response.data;
            setAllSponsors(sponsors);
            setLoading(false);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error('Error fetching analytics:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`sponsor-analytics ${className}`}>
                <div className="sponsor-analytics-loading">
                    <FontAwesomeIcon icon={faChartLine} spin />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`sponsor-analytics ${className}`}>
                <div className="sponsor-analytics-error">
                    <span>{error}</span>
                    <button onClick={fetchAnalyticsData} className="sponsor-analytics-retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Get top 3 most applied sponsors
    const topAppliedSponsors = allSponsors
        .sort((a, b) => (b.appliedBy?.length || 0) - (a.appliedBy?.length || 0))
        .slice(0, 3);

    return (
        <div className={`sponsor-analytics ${className}`}>
            <div className="sponsor-analytics-header">
                <div className="sponsor-analytics-header-left">
                    <FontAwesomeIcon icon={faChartLine} className="sponsor-analytics-icon" />
                    <h3>Top Sponsors</h3>
                </div>
                <Link to="/analytics/" className="sponsor-analytics-more-link">
                    View full analytics
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                </Link>
            </div>
            
            <div className="sponsor-analytics-content">
                <div className="sponsor-analytics-top-sponsors-list">
                    {topAppliedSponsors.map((sponsor, index) => (
                        <div 
                            key={sponsor._id} 
                            className="sponsor-analytics-top-sponsor-item"
                            onClick={() => {
                                const url = sponsor.rootDomain || sponsor.sponsorLink;
                                if (url) {
                                    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                                    window.open(fullUrl, '_blank', 'noopener,noreferrer');
                                }
                            }}
                            title={`Click to visit ${sponsor.sponsorName}`}
                        >
                            <div className="top-sponsor-rank">{index + 1}</div>
                            <div className="top-sponsor-info">
                                <h5>{sponsor.sponsorName}</h5>
                                <p>{sponsor.newsletterSponsored}</p>
                            </div>
                            <div className="top-sponsor-meta">
                                <span className="applications">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    {sponsor.appliedBy?.length || 0}
                                </span>
                                <span className="subscribers">
                                    <FontAwesomeIcon icon={faUsers} />
                                    {sponsor.subscriberCount?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SponsorAnalytics;
