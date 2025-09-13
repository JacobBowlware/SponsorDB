import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, 
    faEye, 
    faChartLine, 
    faArrowLeft, 
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
}

interface SponsorApplication {
    id: string;
    sponsorName: string;
    sponsorId: string;
    contactEmail: string;
    dateApplied: string;
    status: 'pending' | 'responded' | 'follow_up_needed' | 'closed_won' | 'closed_lost';
    responseDate?: string;
    followUpDate?: string;
    revenue?: number;
    notes?: string;
}

interface Conversation {
    id: string;
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
        id: '1',
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
        id: '2',
        sponsorName: 'Notion',
        sponsorId: '4',
        contactEmail: 'partnerships@notion.so',
        dateApplied: '2024-03-13T11:30:00Z',
        status: 'responded',
        responseDate: '2024-03-15T09:15:00Z',
        notes: 'Interested, discussing terms'
    },
    {
        id: '3',
        sponsorName: 'Calm',
        sponsorId: '6',
        contactEmail: 'business@calm.com',
        dateApplied: '2024-03-15T09:45:00Z',
        status: 'follow_up_needed',
        followUpDate: '2024-03-22T09:45:00Z',
        notes: 'No response yet, follow up needed'
    },
    {
        id: '4',
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
        id: '1',
        sponsorName: 'Notion',
        sponsorId: '4',
        lastContactDate: '2024-03-15T09:15:00Z',
        status: 'active',
        followUpNeeded: false,
        revenue: 0
    },
    {
        id: '2',
        sponsorName: 'Calm',
        sponsorId: '6',
        lastContactDate: '2024-03-15T09:45:00Z',
        status: 'follow_up_needed',
        followUpNeeded: true,
        followUpDate: '2024-03-22T09:45:00Z',
        revenue: 0
    },
    {
        id: '3',
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

const Analytics: React.FC = () => {
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

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            
            // Check if we're in local development
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalDev) {
                // Use mock data for development
                setApplications(MOCK_APPLICATIONS);
                setConversations(MOCK_CONVERSATIONS);
                setLoading(false);
                return;
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // TODO: Replace with actual API calls
            // const applicationsResponse = await axios.get(`${config.backendUrl}applications`, {
            //     headers: { 'x-auth-token': token }
            // });
            // const conversationsResponse = await axios.get(`${config.backendUrl}conversations`, {
            //     headers: { 'x-auth-token': token }
            // });
            
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

    const getActiveConversations = () => {
        return conversations.filter(conv => conv.status === 'active' || conv.status === 'pending_response').length;
    };

    const getPendingFollowUps = () => {
        return conversations.filter(conv => conv.followUpNeeded).length;
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

    const handleMarkResponse = (applicationId: string) => {
        setApplications(prev => prev.map(app => 
            app.id === applicationId 
                ? { ...app, status: 'responded' as const, responseDate: new Date().toISOString() }
                : app
        ));
    };

    const handleMarkClosedWon = (application: SponsorApplication) => {
        setSelectedApplication(application);
        setRevenueAmount('');
        setShowRevenueModal(true);
    };

    const handleConfirmRevenue = () => {
        if (selectedApplication && revenueAmount) {
            const revenue = parseInt(revenueAmount);
            if (!isNaN(revenue) && revenue > 0) {
                setApplications(prev => prev.map(app => 
                    app.id === selectedApplication.id 
                        ? { ...app, status: 'closed_won' as const, revenue }
                        : app
                ));
                setShowRevenueModal(false);
                setSelectedApplication(null);
                setRevenueAmount('');
            }
        }
    };

    const handleMarkClosedLost = (applicationId: string) => {
        setApplications(prev => prev.map(app => 
            app.id === applicationId 
                ? { ...app, status: 'closed_lost' as const }
                : app
        ));
    };

    const handleFollowUp = (conversation: Conversation) => {
        // In dev mode, create a mailto link with pre-filled content
        const newsletterInfo = {
            name: "Tech Weekly",
            topic: "Technology and Innovation",
            audienceSize: "15,000",
            engagementRate: "12%"
        };
        
        const subject = `Follow-up: Newsletter Sponsorship Opportunity - ${conversation.sponsorName}`;
        const body = `Hi there,

I hope this email finds you well. I wanted to follow up on my previous outreach regarding a potential newsletter sponsorship opportunity.

About Tech Weekly:
- 15,000+ engaged subscribers
- 12% average open rate
- Focus: Technology and Innovation
- Weekly publication every Tuesday

I believe your brand would be a great fit for our audience. Would you be interested in discussing a potential partnership?

I'd love to schedule a brief call to discuss how we can work together.

Best regards,
[Your Name]
Tech Weekly Newsletter`;

        const mailtoLink = `mailto:${conversation.sponsorName.toLowerCase().replace(/\s+/g, '')}@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
        
        // Mark follow-up as sent
        setConversations(prev => prev.map(conv => 
            conv.id === conversation.id 
                ? { ...conv, followUpNeeded: false, lastContactDate: new Date().toISOString() }
                : conv
        ));
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
            <div className="analytics-header">
                <button className="analytics-back-btn" onClick={() => navigate('/sponsors')}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Sponsors
                </button>
                <h1>Revenue Analytics</h1>
                <p>Track your newsletter sponsorship performance and revenue</p>
            </div>

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
                            <FontAwesomeIcon icon={faComments} />
                        </div>
                        <div className="card-content">
                            <div className="card-title">Active Conversations</div>
                            <div className="card-value">{getActiveConversations()}</div>
                            <div className="card-subtitle">{getPendingFollowUps()} pending follow-ups</div>
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
                            <div key={app.id} className="table-row">
                                <div className="table-col">
                                    <div className="sponsor-name">{app.sponsorName}</div>
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
                                        <button 
                                            className="action-btn response-btn"
                                            onClick={() => handleMarkResponse(app.id)}
                                        >
                                            <FontAwesomeIcon icon={faReply} />
                                            Mark Responded
                                        </button>
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
                                                onClick={() => handleMarkClosedLost(app.id)}
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

                {/* Active Conversations */}
                <div className="analytics-section">
                    <h3>Active Conversations</h3>
                    <div className="conversations-list">
                        {conversations.map((conv) => (
                            <div key={conv.id} className="conversation-item">
                                <div className="conversation-info">
                                    <div className="conversation-name">{conv.sponsorName}</div>
                                    <div className="conversation-date">
                                        Last contact: {new Date(conv.lastContactDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="conversation-status">
                                    <span className={`status-badge ${conv.status}`}>
                                        {conv.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="conversation-actions">
                                    {conv.followUpNeeded && (
                                        <button 
                                            className="follow-up-btn"
                                            onClick={() => handleFollowUp(conv)}
                                        >
                                            <FontAwesomeIcon icon={faEnvelope} />
                                            Send Follow-up
                                        </button>
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