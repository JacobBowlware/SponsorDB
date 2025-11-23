import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, 
    faEye, 
    faChartLine, 
    faDatabase, 
    faEnvelope, 
    faCalendarAlt,
    faDollarSign,
    faReply,
    faComments,
    faArrowTrendUp,
    faClock,
    faUser,
    faPlus,
    faEdit,
    faTrash,
    faCheck,
    faTimes
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
    // Affiliate program fields
    isAffiliateProgram?: boolean;
    affiliateSignupLink?: string;
    commissionInfo?: string;
    interestedUsers?: string[];
}

interface SponsorApplication {
    _id: string;
    sponsorName: string;
    sponsorId: string;
    contactEmail: string;
    dateApplied: string;
    status: 'pending' | 'responded' | 'follow_up_needed' | 'closed_won' | 'closed_lost';
    responseDate?: string;
    followUpDate?: string;
    revenue?: number;
    notes?: string;
    lastContactDate?: string;
}

interface Conversation {
    _id: string;
    sponsorName: string;
    sponsorId: string;
    lastContactDate: string;
    status: 'active' | 'pending_response' | 'follow_up_needed' | 'closed';
    followUpNeeded: boolean;
    followUpDate?: string;
    revenue?: number;
}

// Mock data for the new analytics system
const MOCK_APPLICATIONS: SponsorApplication[] = [
    {
        _id: '1',
        sponsorName: 'Eight Sleep',
        sponsorId: '1',
        contactEmail: 'partnerships@eightsleep.com',
        dateApplied: '2024-03-16T14:20:00Z',
        status: 'closed_won',
        responseDate: '2024-03-18T10:30:00Z',
        revenue: 2500,
        notes: 'Great partnership, 3-month deal'
    },
    {
        _id: '2',
        sponsorName: 'Notion',
        sponsorId: '4',
        contactEmail: 'partnerships@notion.so',
        dateApplied: '2024-03-13T11:30:00Z',
        status: 'responded',
        responseDate: '2024-03-15T09:15:00Z',
        notes: 'Interested, discussing terms'
    },
    {
        _id: '3',
        sponsorName: 'Calm',
        sponsorId: '6',
        contactEmail: 'business@calm.com',
        dateApplied: '2024-03-15T09:45:00Z',
        status: 'follow_up_needed',
        followUpDate: '2024-03-22T09:45:00Z',
        notes: 'No response yet, follow up needed'
    },
    {
        _id: '4',
        sponsorName: 'Spotify',
        sponsorId: '8',
        contactEmail: 'partnerships@spotify.com',
        dateApplied: '2024-03-17T10:15:00Z',
        status: 'pending',
        notes: 'Just applied, waiting for response'
    }
];

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        _id: '1',
        sponsorName: 'Notion',
        sponsorId: '4',
        lastContactDate: '2024-03-15T09:15:00Z',
        status: 'active',
        followUpNeeded: false,
        revenue: 0
    },
    {
        _id: '2',
        sponsorName: 'Calm',
        sponsorId: '6',
        lastContactDate: '2024-03-15T09:45:00Z',
        status: 'follow_up_needed',
        followUpNeeded: true,
        followUpDate: '2024-03-22T09:45:00Z',
        revenue: 0
    },
    {
        _id: '3',
        sponsorName: 'Spotify',
        sponsorId: '8',
        lastContactDate: '2024-03-17T10:15:00Z',
        status: 'pending_response',
        followUpNeeded: false,
        revenue: 0
    }
];

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

interface AnalyticsProps {
    isSubscribed: boolean;
    user?: {
        email: string;
        isAdmin?: boolean;
        newsletterInfo?: {
            name?: string;
            topic?: string;
            audience_size?: number;
            engagement_rate?: number;
            publishing_frequency?: string;
            audience_demographics?: {
                age_range?: string;
                income_range?: string;
                location?: string;
                interests?: string[];
                job_titles?: string[];
            };
        } | null;
    };
}

const Analytics: React.FC<AnalyticsProps> = ({ isSubscribed, user }) => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<SponsorApplication[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddApplication, setShowAddApplication] = useState(false);
    const [editingApplication, setEditingApplication] = useState<SponsorApplication | null>(null);
    const [showRevenueModal, setShowRevenueModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<SponsorApplication | null>(null);
    const [revenueAmount, setRevenueAmount] = useState('');

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    // Show subscription prompt for unsubscribed users (unless admin)
    if (!isSubscribed && !user?.isAdmin) {
        return (
            <div className="analytics-page">
                <div className="analytics-subscription-prompt">
                    <div className="subscription-prompt-content">
                        <FontAwesomeIcon icon={faChartLine} className="subscription-prompt-icon" />
                        <h2>Access Your Sponsor Analytics</h2>
                        <p>Subscribe to track your outreach performance, revenue, and optimize your sponsor strategy.</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/subscribe')}
                        >
                            Subscribe Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Fetch real applications and conversations
            const [applicationsResponse, conversationsResponse] = await Promise.all([
                axios.get(`${config.backendUrl}userApplications`, {
                    headers: { 'x-auth-token': token }
                }),
                axios.get(`${config.backendUrl}userApplications/conversations`, {
                    headers: { 'x-auth-token': token }
                })
            ]);
            
            setApplications(applicationsResponse.data);
            setConversations(conversationsResponse.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load analytics data');
            console.error('Error fetching analytics:', err);
            setLoading(false);
        }
    };

    // Helper functions for analytics calculations
    const getTotalRevenue = () => {
        return applications
            .filter(app => app.revenue)
            .reduce((sum, app) => sum + (app.revenue || 0), 0);
    };

    const getResponseRate = () => {
        const totalApplications = applications.length;
        const respondedApplications = applications.filter(app => 
            app.status === 'responded' || app.status === 'closed_won' || app.status === 'closed_lost'
        ).length;
        return totalApplications > 0 ? Math.round((respondedApplications / totalApplications) * 100) : 0;
    };

    const getPendingApplications = () => {
        return applications.filter(app => app.status === 'pending').length;
    };

    const getClosedWonApplications = () => {
        return applications.filter(app => app.status === 'closed_won').length;
    };

    const getClosedLostApplications = () => {
        return applications.filter(app => app.status === 'closed_lost').length;
    };

    const needsFollowUp = (application: SponsorApplication) => {
        const now = new Date();
        const appliedDate = new Date(application.dateApplied);
        const daysSinceApplied = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If it's been 3+ days and still pending, suggest follow-up
        return daysSinceApplied >= 3 && application.status === 'pending';
    };

    const getROI = () => {
        const totalRevenue = getTotalRevenue();
        const subscriptionCost = 29; // Monthly subscription cost
        return totalRevenue > 0 ? Math.round((totalRevenue / subscriptionCost) * 100) : 0;
    };

    const getRevenueThisMonth = () => {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        return applications
            .filter(app => {
                if (!app.revenue) return false;
                const appDate = new Date(app.dateApplied);
                return appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear;
            })
            .reduce((sum, app) => sum + (app.revenue || 0), 0);
    };

    const getRevenueLastMonth = () => {
        const currentDate = new Date();
        const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
        const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
        
        return applications
            .filter(app => {
                if (!app.revenue) return false;
                const appDate = new Date(app.dateApplied);
                return appDate.getMonth() === lastMonth && appDate.getFullYear() === lastMonthYear;
            })
            .reduce((sum, app) => sum + (app.revenue || 0), 0);
    };

    const getRevenueGrowth = () => {
        const thisMonth = getRevenueThisMonth();
        const lastMonth = getRevenueLastMonth();
        if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
        return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    };

    const handleMarkResponse = async (applicationId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            await axios.put(`${config.backendUrl}userApplications/${applicationId}`, {
                status: 'responded',
                responseDate: new Date().toISOString()
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setApplications(prev => prev.map(app => 
                app._id === applicationId 
                    ? { ...app, status: 'responded' as const, responseDate: new Date().toISOString() }
                    : app
            ));
        } catch (err) {
            console.error('Error updating application status:', err);
        }
    };

    const handleMarkClosedWon = (application: SponsorApplication) => {
        setSelectedApplication(application);
        setRevenueAmount('');
        setShowRevenueModal(true);
    };

    const handleConfirmRevenue = async () => {
        if (selectedApplication && revenueAmount) {
            const revenue = parseInt(revenueAmount);
            if (!isNaN(revenue) && revenue > 0) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    await axios.put(`${config.backendUrl}userApplications/${selectedApplication._id}`, {
                        status: 'closed_won',
                        revenue
                    }, {
                        headers: { 'x-auth-token': token }
                    });
                    
                    setApplications(prev => prev.map(app => 
                        app._id === selectedApplication._id 
                            ? { ...app, status: 'closed_won' as const, revenue }
                            : app
                    ));
                    setShowRevenueModal(false);
                    setSelectedApplication(null);
                    setRevenueAmount('');
                } catch (err) {
                    console.error('Error updating application revenue:', err);
                }
            }
        }
    };

    const handleMarkClosedLost = async (applicationId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            await axios.put(`${config.backendUrl}userApplications/${applicationId}`, {
                status: 'closed_lost'
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setApplications(prev => prev.map(app => 
                app._id === applicationId 
                    ? { ...app, status: 'closed_lost' as const }
                    : app
            ));
        } catch (err) {
            console.error('Error updating application status:', err);
        }
    };

    const handleFollowUp = (item: Conversation | SponsorApplication) => {
        // Get user's newsletter info from props or use defaults
        const newsletterName = user?.newsletterInfo?.name || 'My Newsletter';
        const newsletterTopic = user?.newsletterInfo?.topic || 'your industry/niche';
        const audienceSize = user?.newsletterInfo?.audience_size || 0;
        const engagementRate = user?.newsletterInfo?.engagement_rate || 0;
        const publishingFreq = user?.newsletterInfo?.publishing_frequency || 'weekly';
        const demographics = user?.newsletterInfo?.audience_demographics;
        
        // Build audience description
        let audienceDescription = 'a growing community of engaged readers';
        if (audienceSize > 0) {
            audienceDescription = `${audienceSize.toLocaleString()} engaged subscribers`;
        }
        if (engagementRate > 0) {
            audienceDescription += ` with a ${engagementRate}% engagement rate`;
        }
        
        // Build demographic info
        let demographicInfo = '';
        if (demographics) {
            const parts = [];
            if (demographics.age_range) parts.push(`ages ${demographics.age_range}`);
            if (demographics.income_range) parts.push(`${demographics.income_range} income`);
            if (demographics.location) parts.push(demographics.location);
            if (parts.length > 0) {
                demographicInfo = `\n\nOur audience consists primarily of ${parts.join(', ')} readers.`;
            }
        }
        
        const subject = `Follow-up: Partnership Opportunity - ${newsletterName}`;
        const body = `Hi there,

I wanted to follow up on my previous outreach about a potential newsletter sponsorship opportunity.

Quick reminder about ${newsletterName}:
- ${audienceDescription}
- ${publishingFreq.charAt(0).toUpperCase() + publishingFreq.slice(1)} publication focused on ${newsletterTopic}${demographicInfo}

Are you still open to discussing a sponsorship? Happy to share our media kit and rates.

Best,
[Your Name]
${newsletterName}`;

        // Use the contact email from the application or conversation
        const contactEmail = 'contactEmail' in item ? item.contactEmail : `${item.sponsorName.toLowerCase().replace(/\s+/g, '')}@example.com`;
        const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
        
        // Update the last contact date
        if ('_id' in item) {
            // This is a conversation
            setConversations(prev => prev.map(conv => 
                conv._id === item._id 
                    ? { ...conv, followUpNeeded: false, lastContactDate: new Date().toISOString() }
                    : conv
            ));
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

    return (
        <div className="analytics-page">
            <div className="analytics-content">
                {/* Overview Cards */}
                <div className="analytics-overview">
                    <div className="overview-card revenue-card">
                        <div className="card-icon">
                            <FontAwesomeIcon icon={faDollarSign} />
                        </div>
                        <div className="card-content">
                            <div className="card-title">This Month's Revenue</div>
                            <div className="card-value">${getRevenueThisMonth().toLocaleString()}</div>
                            <div className="card-change positive">
                                +{getRevenueGrowth()}% vs last month
                            </div>
                        </div>
                    </div>

                    <div className="overview-card response-card">
                        <div className="card-icon">
                            <FontAwesomeIcon icon={faReply} />
                        </div>
                        <div className="card-content">
                            <div className="card-title">Outreach Response Rate</div>
                            <div className="card-value">{getResponseRate()}%</div>
                            <div className="card-benchmark">vs 8% industry avg</div>
                        </div>
                    </div>

                    <div className="overview-card conversations-card">
                        <div className="card-icon">
                            <FontAwesomeIcon icon={faDatabase} />
                        </div>
                        <div className="card-content">
                            <div className="card-title">Application Status</div>
                            <div className="card-value">{applications.length}</div>
                            <div className="card-subtitle">
                                {getPendingApplications()} pending • {getClosedWonApplications()} won • {getClosedLostApplications()} lost
                            </div>
                        </div>
                    </div>

                    <div className="overview-card roi-card">
                        <div className="card-icon">
                            <FontAwesomeIcon icon={faArrowTrendUp} />
                        </div>
                        <div className="card-content">
                            <div className="card-title">ROI on SponsorDB</div>
                            <div className="card-value">{getROI()}%</div>
                            <div className="card-calculation">Revenue generated / subscription cost</div>
                        </div>
                    </div>
                </div>

                {/* Revenue Tracking Section */}
                <div className="analytics-section">
                    <div className="section-header">
                        <h3>Revenue Tracking</h3>
                        <button 
                            className="add-application-btn"
                            onClick={() => setShowAddApplication(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Add Application
                        </button>
                    </div>
                    
                    <div className="applications-table">
                        <div className="table-header">
                            <div className="table-col">Sponsor</div>
                            <div className="table-col">Applied Date</div>
                            <div className="table-col">Status</div>
                            <div className="table-col">Revenue</div>
                            <div className="table-col">Actions</div>
                        </div>
                        {applications.map((app) => (
                            <div key={app._id} className="table-row">
                                <div className="table-col">
                                    <div className="sponsor-name">{app.sponsorName}</div>
                                    <div className="sponsor-email-spacer"></div>
                                    <div className="sponsor-email">{app.contactEmail}</div>
                                </div>
                                <div className="table-col">
                                    {new Date(app.dateApplied).toLocaleDateString()}
                                </div>
                                <div className="table-col">
                                    <span className={`status-badge ${app.status}`}>
                                        {app.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="table-col">
                                    {app.revenue ? `$${app.revenue.toLocaleString()}` : '-'}
                                </div>
                                <div className="table-col actions-col">
                                    {app.status === 'pending' && (
                                        <div className="action-buttons">
                                            <button 
                                                className="action-btn response-btn"
                                                onClick={() => handleMarkResponse(app._id)}
                                            >
                                                <FontAwesomeIcon icon={faReply} />
                                                Mark Responded
                                            </button>
                                            {needsFollowUp(app) && (
                                                <button 
                                                    className="action-btn follow-up-btn"
                                                    onClick={() => handleFollowUp(app)}
                                                >
                                                    <FontAwesomeIcon icon={faEnvelope} />
                                                    Resend
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {app.status === 'responded' && (
                                        <div className="action-buttons">
                                            <button 
                                                className="action-btn success-btn"
                                                onClick={() => handleMarkClosedWon(app)}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                                Won
                                            </button>
                                            <button 
                                                className="action-btn danger-btn"
                                                onClick={() => handleMarkClosedLost(app._id)}
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                                Lost
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue Chart Placeholder */}
                <div className="analytics-section">
                    <h3>Monthly Revenue Trend</h3>
                    <div className="revenue-chart">
                        <div className="chart-placeholder">
                            <FontAwesomeIcon icon={faChartLine} />
                            <p>Revenue trend chart coming soon</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Modal */}
            {showRevenueModal && selectedApplication && (
                <div className="modal-overlay">
                    <div className="revenue-modal">
                        <div className="modal-header">
                            <h3>Record Revenue</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowRevenueModal(false)}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <p>How much revenue did you generate from <strong>{selectedApplication.sponsorName}</strong>?</p>
                            <div className="revenue-input-group">
                                <span className="currency-symbol">$</span>
                                <input
                                    type="number"
                                    value={revenueAmount}
                                    onChange={(e) => setRevenueAmount(e.target.value)}
                                    placeholder="0"
                                    className="revenue-input"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    className="btn-cancel"
                                    onClick={() => setShowRevenueModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-confirm"
                                    onClick={handleConfirmRevenue}
                                    disabled={!revenueAmount || parseInt(revenueAmount) <= 0}
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                    Record Revenue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics; 