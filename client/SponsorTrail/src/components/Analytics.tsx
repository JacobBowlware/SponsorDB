import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, 
    faEye, 
    faChartLine, 
    faArrowLeft, 
    faDatabase, 
    faEnvelope, 
    faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
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
    isViewed?: boolean;
    isApplied?: boolean;
    dateViewed?: string;
    dateApplied?: string;
    appliedBy?: string[];
}

// Mock data for development mode
const MOCK_SPONSORS: Sponsor[] = [
    {
        _id: '1',
        sponsorName: 'Eight Sleep',
        sponsorLink: 'https://eightsleep.com',
        rootDomain: 'eightsleep.com',
        tags: ['Technology', 'Health', 'Sleep'],
        newsletterSponsored: 'The Hustle',
        subscriberCount: 1500000,
        businessContact: 'partnerships@eightsleep.com',
        dateAdded: '2024-01-15',
        isViewed: true,
        isApplied: true,
        dateViewed: '2024-03-15T10:30:00Z',
        dateApplied: '2024-03-16T14:20:00Z',
        appliedBy: ['user1', 'user2']
    },
    {
        _id: '2',
        sponsorName: 'ExpressVPN',
        sponsorLink: 'https://expressvpn.com',
        rootDomain: 'expressvpn.com',
        tags: ['Technology', 'Security', 'Privacy'],
        newsletterSponsored: 'TLDR Daily',
        subscriberCount: 800000,
        businessContact: 'marketing@expressvpn.com',
        dateAdded: '2024-01-20',
        isViewed: true,
        isApplied: false,
        dateViewed: '2024-03-10T09:15:00Z',
        dateApplied: undefined,
        appliedBy: []
    },
    {
        _id: '3',
        sponsorName: 'EmailTree',
        sponsorLink: 'https://emailtree.com',
        rootDomain: 'emailtree.com',
        tags: ['Technology', 'Productivity', 'Email'],
        newsletterSponsored: 'Morning Brew',
        subscriberCount: 2000000,
        businessContact: 'hello@emailtree.com',
        dateAdded: '2024-02-01',
        isViewed: false,
        isApplied: false,
        dateViewed: undefined,
        dateApplied: undefined,
        appliedBy: []
    },
    {
        _id: '4',
        sponsorName: 'Notion',
        sponsorLink: 'https://notion.so',
        rootDomain: 'notion.so',
        tags: ['Technology', 'Productivity', 'Software'],
        newsletterSponsored: 'The Hustle',
        subscriberCount: 1200000,
        businessContact: 'partnerships@notion.so',
        dateAdded: '2024-02-10',
        isViewed: true,
        isApplied: true,
        dateViewed: '2024-03-12T16:45:00Z',
        dateApplied: '2024-03-13T11:30:00Z',
        appliedBy: ['user1']
    },
    {
        _id: '5',
        sponsorName: 'Stripe',
        sponsorLink: 'https://stripe.com',
        rootDomain: 'stripe.com',
        tags: ['Technology', 'Finance', 'Payments'],
        newsletterSponsored: 'TLDR Daily',
        subscriberCount: 900000,
        businessContact: 'partnerships@stripe.com',
        dateAdded: '2024-02-15',
        isViewed: true,
        isApplied: false,
        dateViewed: '2024-03-08T13:20:00Z',
        dateApplied: undefined,
        appliedBy: []
    },
    {
        _id: '6',
        sponsorName: 'Calm',
        sponsorLink: 'https://calm.com',
        rootDomain: 'calm.com',
        tags: ['Health', 'Mental Health', 'Wellness'],
        newsletterSponsored: 'Morning Brew',
        subscriberCount: 1800000,
        businessContact: 'business@calm.com',
        dateAdded: '2024-02-20',
        isViewed: true,
        isApplied: true,
        dateViewed: '2024-03-14T08:10:00Z',
        dateApplied: '2024-03-15T09:45:00Z',
        appliedBy: ['user1', 'user2', 'user3']
    },
    {
        _id: '7',
        sponsorName: 'Figma',
        sponsorLink: 'https://figma.com',
        rootDomain: 'figma.com',
        tags: ['Technology', 'Design', 'Productivity'],
        newsletterSponsored: 'The Hustle',
        subscriberCount: 1100000,
        businessContact: 'partnerships@figma.com',
        dateAdded: '2024-02-25',
        isViewed: false,
        isApplied: false,
        dateViewed: undefined,
        dateApplied: undefined,
        appliedBy: []
    },
    {
        _id: '8',
        sponsorName: 'Spotify',
        sponsorLink: 'https://spotify.com',
        rootDomain: 'spotify.com',
        tags: ['Entertainment', 'Music', 'Technology'],
        newsletterSponsored: 'Morning Brew',
        subscriberCount: 2500000,
        businessContact: 'partnerships@spotify.com',
        dateAdded: '2024-03-01',
        isViewed: true,
        isApplied: true,
        dateViewed: '2024-03-16T12:00:00Z',
        dateApplied: '2024-03-17T10:15:00Z',
        appliedBy: ['user1']
    }
];

const Analytics: React.FC = () => {
    const navigate = useNavigate();
    const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
    const [userStats, setUserStats] = useState({
        viewed: 0,
        applied: 0,
        total: 0
    });
    const [monthlyStats, setMonthlyStats] = useState({
        viewedThisMonth: 0,
        appliedThisMonth: 0
    });
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
                // Use mock data for development
                setAllSponsors(MOCK_SPONSORS);
                
                // Calculate user stats from mock data
                const viewed = MOCK_SPONSORS.filter((s: Sponsor) => s.isViewed).length;
                const applied = MOCK_SPONSORS.filter((s: Sponsor) => s.isApplied).length;
                setUserStats({ viewed, applied, total: MOCK_SPONSORS.length });

                // Calculate monthly stats from mock data
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();
                
                const viewedThisMonth = MOCK_SPONSORS.filter((s: Sponsor) => {
                    if (!s.isViewed || !s.dateViewed) return false;
                    const viewDate = new Date(s.dateViewed);
                    return viewDate.getMonth() === currentMonth && viewDate.getFullYear() === currentYear;
                }).length;
                
                const appliedThisMonth = MOCK_SPONSORS.filter((s: Sponsor) => {
                    if (!s.isApplied || !s.dateApplied) return false;
                    const applyDate = new Date(s.dateApplied);
                    return applyDate.getMonth() === currentMonth && applyDate.getFullYear() === currentYear;
                }).length;
                
                setMonthlyStats({
                    viewedThisMonth,
                    appliedThisMonth
                });
                
                setLoading(false);
                return;
            }
            
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
            
            const sponsors = response.data;
            setAllSponsors(sponsors);
            
            // Calculate user stats
            const viewed = sponsors.filter((s: Sponsor) => s.isViewed).length;
            const applied = sponsors.filter((s: Sponsor) => s.isApplied).length;
            setUserStats({ viewed, applied, total: sponsors.length });

            // Calculate monthly stats (this month's activity)
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            console.log('Analytics Debug:', {
                currentMonth,
                currentYear,
                totalSponsors: sponsors.length,
                viewedSponsors: sponsors.filter((s: Sponsor) => s.isViewed).length,
                appliedSponsors: sponsors.filter((s: Sponsor) => s.isApplied).length,
                sponsorsWithViewDates: sponsors.filter((s: Sponsor) => s.isViewed && s.dateViewed).length,
                sponsorsWithApplyDates: sponsors.filter((s: Sponsor) => s.isApplied && s.dateApplied).length
            });
            
            // Count sponsors viewed this month
            const viewedThisMonth = sponsors.filter((s: Sponsor) => {
                if (!s.isViewed || !s.dateViewed) return false;
                const viewDate = new Date(s.dateViewed);
                const isThisMonth = viewDate.getMonth() === currentMonth && 
                                   viewDate.getFullYear() === currentYear;
                if (isThisMonth) {
                    console.log('Sponsor viewed this month:', s.sponsorName, viewDate);
                }
                return isThisMonth;
            }).length;
            
            // Count sponsors applied this month
            const appliedThisMonth = sponsors.filter((s: Sponsor) => {
                if (!s.isApplied || !s.dateApplied) return false;
                const applyDate = new Date(s.dateApplied);
                const isThisMonth = applyDate.getMonth() === currentMonth && 
                                   applyDate.getFullYear() === currentYear;
                if (isThisMonth) {
                    console.log('Sponsor applied this month:', s.sponsorName, applyDate);
                }
                return isThisMonth;
            }).length;
            
            setMonthlyStats({
                viewedThisMonth,
                appliedThisMonth
            });

            setLoading(false);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error('Error fetching analytics:', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="analytics-loading">
                <FontAwesomeIcon icon={faChartLine} spin />
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-error">
                <p>{error}</p>
                <button onClick={fetchAnalyticsData}>Try Again</button>
            </div>
        );
    }

    // Helper functions for the growth chart
    const getNewSponsorsThisMonth = () => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        return allSponsors.filter(sponsor => {
            const sponsorDate = new Date(sponsor.dateAdded);
            return sponsorDate.getMonth() === currentMonth && 
                   sponsorDate.getFullYear() === currentYear;
        }).length;
    };

    const getNewSponsorsLastMonth = () => {
        const currentDate = new Date();
        const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
        const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
        
        return allSponsors.filter(sponsor => {
            const sponsorDate = new Date(sponsor.dateAdded);
            return sponsorDate.getMonth() === lastMonth && 
                   sponsorDate.getFullYear() === lastMonthYear;
        }).length;
    };

    const getGrowthRate = () => {
        const thisMonth = getNewSponsorsThisMonth();
        const lastMonth = getNewSponsorsLastMonth();
        
        if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
        return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    };

    const getLast6MonthsData = () => {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
            
            const sponsorCount = allSponsors.filter(sponsor => {
                const sponsorDate = new Date(sponsor.dateAdded);
                return sponsorDate.getMonth() === monthDate.getMonth() && 
                       sponsorDate.getFullYear() === monthDate.getFullYear();
            }).length;
            
            months.push({
                month: monthName,
                count: sponsorCount,
                height: 0 // Will be calculated below
            });
        }
        
        // Calculate heights for the chart bars
        const maxCount = Math.max(...months.map(m => m.count));
        months.forEach(month => {
            month.height = maxCount > 0 ? Math.round((month.count / maxCount) * 80) : 0;
        });
        
        return months;
    };

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <button className="analytics-back-btn" onClick={() => navigate('/sponsors')}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Sponsors
                </button>
                <h1>Analytics Dashboard</h1>
            </div>

            <div className="analytics-content">
                {/* Key Metrics Row */}
                <div className="analytics-metrics-row">
                    <div className="metric-card">
                        <div className="metric-icon">
                            <FontAwesomeIcon icon={faEye} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-value">{userStats.viewed}</div>
                            <div className="metric-label">Viewed</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-value">{userStats.applied}</div>
                            <div className="metric-label">Applied</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">
                            <FontAwesomeIcon icon={faDatabase} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-value">{userStats.total}</div>
                            <div className="metric-label">Available</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-value">{monthlyStats.viewedThisMonth}</div>
                            <div className="metric-label">This Month</div>
                        </div>
                    </div>
                </div>

                {/* Growth Chart */}
                <div className="analytics-section">
                    <h3>New Sponsors Over Time</h3>
                    <div className="growth-chart">
                        <div className="chart-stats">
                            <div className="chart-stat">
                                <span className="stat-label">This Month</span>
                                <span className="stat-value">{getNewSponsorsThisMonth()}</span>
                            </div>
                            <div className="chart-stat">
                                <span className="stat-label">Last Month</span>
                                <span className="stat-value">{getNewSponsorsLastMonth()}</span>
                            </div>
                            <div className="chart-stat">
                                <span className="stat-label">Growth Rate</span>
                                <span className="stat-value">{getGrowthRate()}%</span>
                            </div>
                        </div>
                        <div className="chart-bars">
                            {getLast6MonthsData().map((monthData, index) => (
                                <div key={monthData.month} className="chart-bar-group">
                                    <div className="chart-bar" style={{ height: `${monthData.height}%` }}>
                                        <span className="bar-value">{monthData.count}</span>
                                    </div>
                                    <span className="bar-label">{monthData.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Sponsors Table */}
                <div className="analytics-section">
                    <h3>Most Applied Sponsors</h3>
                    <div className="sponsors-table">
                        <div className="table-header">
                            <div className="table-col">Rank</div>
                            <div className="table-col">Sponsor</div>
                            <div className="table-col">Newsletter</div>
                            <div className="table-col">Applications</div>
                            <div className="table-col">Subscribers</div>
                        </div>
                        {allSponsors
                            .sort((a, b) => (b.appliedBy?.length || 0) - (a.appliedBy?.length || 0))
                            .slice(0, 10)
                            .map((sponsor, index) => (
                                <div 
                                    key={sponsor._id} 
                                    className="table-row"
                                    onClick={() => {
                                        const url = sponsor.rootDomain || sponsor.sponsorLink;
                                        if (url) {
                                            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                                            window.open(fullUrl, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                >
                                    <div className="table-col rank-col">
                                        <span className="rank-badge">{index + 1}</span>
                                    </div>
                                    <div className="table-col sponsor-col">
                                        <div className="sponsor-name">{sponsor.sponsorName}</div>
                                        <div className="sponsor-tags">
                                            {sponsor.tags.slice(0, 2).map((tag, i) => (
                                                <span key={i} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="table-col newsletter-col">{sponsor.newsletterSponsored}</div>
                                    <div className="table-col applications-col">{sponsor.appliedBy?.length || 0}</div>
                                    <div className="table-col subscribers-col">{sponsor.subscriberCount?.toLocaleString()}</div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Your Applied Sponsors */}
                {userStats.applied > 0 && (
                    <div className="analytics-section">
                        <h3>Your Applied Sponsors</h3>
                        <div className="applied-sponsors-list">
                            {allSponsors.filter(s => s.isApplied).map((sponsor) => (
                                <div 
                                    key={sponsor._id} 
                                    className="applied-sponsor-item"
                                    onClick={() => {
                                        const url = sponsor.rootDomain || sponsor.sponsorLink;
                                        if (url) {
                                            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                                            window.open(fullUrl, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                >
                                    <div className="sponsor-info">
                                        <div className="sponsor-name">{sponsor.sponsorName}</div>
                                        <div className="sponsor-newsletter">{sponsor.newsletterSponsored}</div>
                                    </div>
                                    <div className="sponsor-meta">
                                        <div className="applied-date">
                                            Applied {sponsor.dateApplied ? new Date(sponsor.dateApplied).toLocaleDateString() : new Date(sponsor.dateAdded).toLocaleDateString()}
                                        </div>
                                        <div className="subscriber-count">
                                            {sponsor.subscriberCount.toLocaleString()} subscribers
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics; 