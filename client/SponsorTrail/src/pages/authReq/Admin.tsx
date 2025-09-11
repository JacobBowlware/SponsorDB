import { useEffect, useState } from "react";
import config from '../../config';
import axios from "axios";

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChevronDown, 
    faChevronUp, 
    faTrash, 
    faEdit, 
    faEye, 
    faEyeSlash, 
    faRobot, 
    faExclamationTriangle,
    faCheck,
    faTimes,
    faChartLine,
    faUsers,
    faEnvelope,
    faGlobe,
    faCalendarAlt,
    faFilter,
    faSearch,
    faSort,
    faSortUp,
    faSortDown
} from "@fortawesome/free-solid-svg-icons";

interface Sponsor {
    newsletterSponsored: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    subscriberCount: number;
    businessContact?: string;
    confidence: number;
    _id: string;
    // New enriched fields
    contactMethod?: 'email' | 'partner-page' | 'media-kit' | 'none';
    estimatedSubscribers?: number;
    subscriberReasoning?: string;
    enrichmentNotes?: string;
    analysisStatus?: 'complete' | 'manual_review_required' | 'pending';
    sponsorshipEvidence?: string;
    dateAdded?: string;
    lastAnalyzed?: string;
}

interface Analytics {
    totalPotentialSponsors: number;
    totalApprovedSponsors: number;
    totalDeniedSponsors: number;
    averageConfidence: number;
    sponsorsThisWeek: number;
    sponsorsThisMonth: number;
    topNewsletters: Array<{name: string, count: number}>;
    contactMethodBreakdown: Array<{method: string, count: number}>;
    weeklyGrowth: Array<{date: string, count: number}>;
}

const Admin = () => {
    const [potentialSponsors, setPotentialSponsors] = useState<Sponsor[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('confidence');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Get all potential sponsors from the database
    const getSponsorData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}potentialSponsors/`, {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            });
            
            const sponsors = response.data.sort((a: Sponsor, b: Sponsor) => b.confidence - a.confidence);
            setPotentialSponsors(sponsors);
        } catch (err) {
            console.error('Error fetching sponsors:', err);
        }
    };

    // Get analytics data
    const getAnalytics = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}sponsors/analytics`, {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            });
            setAnalytics(response.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            // Create mock analytics for now
            setAnalytics({
                totalPotentialSponsors: potentialSponsors.length,
                totalApprovedSponsors: 0,
                totalDeniedSponsors: 0,
                averageConfidence: potentialSponsors.length > 0 ? 
                    potentialSponsors.reduce((sum, s) => sum + s.confidence, 0) / potentialSponsors.length : 0,
                sponsorsThisWeek: 0,
                sponsorsThisMonth: 0,
                topNewsletters: [],
                contactMethodBreakdown: [],
                weeklyGrowth: []
            });
        }
    };

    // Submit a sponsor to the database
    const handleApprove = async (sponsor: Sponsor) => {
        try {
            await axios.post(`${config.backendUrl}sponsors/`, sponsor, {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            });
            
            // Remove from potential sponsors
            setPotentialSponsors(prev => prev.filter(s => s._id !== sponsor._id));
            setShowModal(false);
            setSelectedSponsor(null);
            
            // Refresh analytics
            await getAnalytics();
        } catch (err) {
            console.error('Error approving sponsor:', err);
        }
    };

    // Delete the potential sponsor from the database
    const handleDeny = async (sponsor: Sponsor) => {
        try {
            // Add domain to denied list if it exists
            if (sponsor.rootDomain) {
                await axios.post(`${config.backendUrl}deniedSponsorLinks/`, {
                    rootDomain: sponsor.rootDomain,
                    reason: "Manually denied by admin"
                }, {
                    headers: {
                        'x-auth-token': localStorage.getItem('token')
                    }
                });
            }

            // Delete the potential sponsor
            await axios.delete(`${config.backendUrl}potentialSponsors/${sponsor._id}`, {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            });
            
            // Remove from list
            setPotentialSponsors(prev => prev.filter(s => s._id !== sponsor._id));
            setShowModal(false);
            setSelectedSponsor(null);
            
            // Refresh analytics
            await getAnalytics();
        } catch (err) {
            console.error('Error denying sponsor:', err);
        }
    };

    // Filter and sort sponsors
    const filteredAndSortedSponsors = potentialSponsors
        .filter(sponsor => {
            const matchesSearch = sponsor.sponsorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                sponsor.newsletterSponsored.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                sponsor.sponsorLink.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || 
                                (filterStatus === 'has-contact' && sponsor.businessContact && sponsor.businessContact.trim() !== '') ||
                                (filterStatus === 'high-confidence' && sponsor.confidence >= 85) ||
                                (filterStatus === 'medium-confidence' && sponsor.confidence >= 70 && sponsor.confidence < 85) ||
                                (filterStatus === 'low-confidence' && sponsor.confidence < 70);
            
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'confidence':
                    comparison = a.confidence - b.confidence;
                    break;
                case 'name':
                    comparison = a.sponsorName.localeCompare(b.sponsorName);
                    break;
                case 'newsletter':
                    comparison = a.newsletterSponsored.localeCompare(b.newsletterSponsored);
                    break;
                case 'date':
                    comparison = new Date(a.dateAdded || '').getTime() - new Date(b.dateAdded || '').getTime();
                    break;
                case 'subscribers':
                    comparison = (a.estimatedSubscribers || 0) - (b.estimatedSubscribers || 0);
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([getSponsorData(), getAnalytics()]);
            setLoading(false);
        };
        fetchData();
    }, []);

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 85) return '#28a745';
        if (confidence >= 70) return '#ffc107';
        return '#dc3545';
    };

    const getContactMethodIcon = (method: string) => {
        switch (method) {
            case 'email': return faEnvelope;
            case 'partner-page': return faGlobe;
            case 'media-kit': return faUsers;
            default: return faTimes;
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="admin-loading__spinner"></div>
                <p>Loading SponsorDB Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header__content">
                    <h1>SponsorDB Dashboard</h1>
                    <p>Manage and approve potential sponsors</p>
                </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="analytics-grid">
                    <div className="analytics-card">
                        <div className="analytics-card__icon">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div className="analytics-card__content">
                            <h3>{analytics.totalPotentialSponsors}</h3>
                            <p>Potential Sponsors</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <div className="analytics-card__icon">
                            <FontAwesomeIcon icon={faCheck} />
                        </div>
                        <div className="analytics-card__content">
                            <h3>{analytics.totalApprovedSponsors}</h3>
                            <p>Approved This Month</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <div className="analytics-card__icon">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>
                        <div className="analytics-card__content">
                            <h3>{analytics.sponsorsThisWeek}</h3>
                            <p>New This Week</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <div className="analytics-card__icon">
                            <FontAwesomeIcon icon={faRobot} />
                        </div>
                        <div className="analytics-card__content">
                            <h3>{Math.round(analytics.averageConfidence)}%</h3>
                            <p>Avg Confidence</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <div className="analytics-card__icon">
                            <FontAwesomeIcon icon={faEnvelope} />
                        </div>
                        <div className="analytics-card__content">
                            <h3>{potentialSponsors.filter(s => s.businessContact && s.businessContact.trim() !== '').length}</h3>
                            <p>With Contact Info</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="admin-controls">
                <div className="admin-controls__search">
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                        type="text"
                        placeholder="Search sponsors, newsletters, or domains..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="admin-controls__filters">
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="admin-controls__filter"
                    >
                        <option value="all">All Sponsors</option>
                        <option value="has-contact">Has Contact Info</option>
                        <option value="high-confidence">High Confidence (85%+)</option>
                        <option value="medium-confidence">Medium Confidence (70-84%)</option>
                        <option value="low-confidence">Low Confidence (&lt;70%)</option>
                    </select>
                    
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="admin-controls__filter"
                    >
                        <option value="confidence">Sort by Confidence</option>
                        <option value="name">Sort by Name</option>
                        <option value="newsletter">Sort by Newsletter</option>
                        <option value="date">Sort by Date</option>
                        <option value="subscribers">Sort by Subscribers</option>
                    </select>
                    
                    <button 
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="admin-controls__sort-btn"
                    >
                        <FontAwesomeIcon icon={sortOrder === 'asc' ? faSortUp : faSortDown} />
                    </button>
                </div>
            </div>

            {/* Sponsors Grid */}
            <div className="sponsors-grid">
                {filteredAndSortedSponsors.length === 0 ? (
                    <div className="sponsors-empty">
                        <FontAwesomeIcon icon={faUsers} />
                        <h3>No sponsors found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    filteredAndSortedSponsors.map((sponsor) => (
                        <div key={sponsor._id} className="sponsor-card">
                            <div className="sponsor-card__header">
                                <div className="sponsor-card__confidence" style={{backgroundColor: getConfidenceColor(sponsor.confidence)}}>
                                    {sponsor.confidence}%
                                </div>
                                <div className="sponsor-card__status">
                                    {sponsor.businessContact && sponsor.businessContact.trim() !== '' ? (
                                        <FontAwesomeIcon 
                                            icon={faEnvelope} 
                                            className="sponsor-card__contact-icon"
                                            style={{color: '#48bb78'}}
                                            title="Has contact information"
                                        />
                                    ) : (
                                        <FontAwesomeIcon 
                                            icon={faTimes} 
                                            className="sponsor-card__contact-icon"
                                            style={{color: '#e53e3e'}}
                                            title="No contact information"
                                        />
                                    )}
                                </div>
                            </div>
                            
                            <div className="sponsor-card__content">
                                <h3 className="sponsor-card__name">{sponsor.sponsorName}</h3>
                                <p className="sponsor-card__newsletter">{sponsor.newsletterSponsored}</p>
                                <a 
                                    href={sponsor.sponsorLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="sponsor-card__link"
                                >
                                    {sponsor.rootDomain || 'View Website'}
                                </a>
                                
                                {/* Business Contact - Prominent Display */}
                                <div className="sponsor-card__business-contact">
                                    <div className="sponsor-card__business-contact-label">
                                        <FontAwesomeIcon icon={getContactMethodIcon(sponsor.contactMethod || 'none')} />
                                        Business Contact
                                    </div>
                                    <div className="sponsor-card__business-contact-value">
                                        {sponsor.businessContact ? (
                                            sponsor.businessContact.includes('@') ? (
                                                <a href={`mailto:${sponsor.businessContact}`}>
                                                    {sponsor.businessContact}
                                                </a>
                                            ) : (
                                                <a href={sponsor.businessContact} target="_blank" rel="noopener noreferrer">
                                                    {sponsor.businessContact}
                                                </a>
                                            )
                                        ) : (
                                            <span style={{color: '#e53e3e', fontStyle: 'italic'}}>
                                                No contact found
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="sponsor-card__tags">
                                    {sponsor.tags?.slice(0, 3).map((tag, index) => (
                                        <span key={index} className="sponsor-card__tag">{tag}</span>
                                    ))}
                                    {sponsor.tags && sponsor.tags.length > 3 && (
                                        <span className="sponsor-card__tag">+{sponsor.tags.length - 3}</span>
                                    )}
                                </div>
                                
                                <div className="sponsor-card__stats">
                                    <div className="sponsor-card__stat">
                                        <FontAwesomeIcon icon={faUsers} />
                                        <span>{sponsor.estimatedSubscribers?.toLocaleString() || 'Unknown'}</span>
                                    </div>
                                    <div className="sponsor-card__stat">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        <span>{new Date(sponsor.dateAdded || '').toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="sponsor-card__actions">
                                <button 
                                    onClick={() => {
                                        setSelectedSponsor(sponsor);
                                        setShowModal(true);
                                    }}
                                    className="sponsor-card__btn sponsor-card__btn--view"
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                    View Details
                                </button>
                                <button 
                                    onClick={() => handleApprove(sponsor)}
                                    className="sponsor-card__btn sponsor-card__btn--approve"
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                    Approve
                                </button>
                                <button 
                                    onClick={() => handleDeny(sponsor)}
                                    className="sponsor-card__btn sponsor-card__btn--deny"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                    Deny
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Sponsor Detail Modal */}
            {showModal && selectedSponsor && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedSponsor.sponsorName}</h2>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="modal-section">
                                <h3>Basic Information</h3>
                                <div className="modal-grid">
                                    <div className="modal-field">
                                        <label>Newsletter</label>
                                        <p>{selectedSponsor.newsletterSponsored}</p>
                                    </div>
                                    <div className="modal-field">
                                        <label>Website</label>
                                        <a href={selectedSponsor.sponsorLink} target="_blank" rel="noopener noreferrer">
                                            {selectedSponsor.sponsorLink}
                                        </a>
                                    </div>
                                    <div className="modal-field">
                                        <label>Confidence Score</label>
                                        <p style={{color: getConfidenceColor(selectedSponsor.confidence)}}>
                                            {selectedSponsor.confidence}%
                                        </p>
                                    </div>
                                    <div className="modal-field">
                                        <label>Estimated Subscribers</label>
                                        <p>{selectedSponsor.estimatedSubscribers?.toLocaleString() || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-section">
                                <h3>Contact Information</h3>
                                <div className="modal-grid">
                                    <div className="modal-field" style={{gridColumn: '1 / -1'}}>
                                        <label>Business Contact</label>
                                        <p style={{
                                            background: '#f0fff4',
                                            border: '2px solid #48bb78',
                                            fontWeight: '600',
                                            fontSize: '1.1rem'
                                        }}>
                                            {selectedSponsor.businessContact ? (
                                                selectedSponsor.businessContact.includes('@') ? (
                                                    <a href={`mailto:${selectedSponsor.businessContact}`}>
                                                        {selectedSponsor.businessContact}
                                                    </a>
                                                ) : (
                                                    <a href={selectedSponsor.businessContact} target="_blank" rel="noopener noreferrer">
                                                        {selectedSponsor.businessContact}
                                                    </a>
                                                )
                                            ) : (
                                                <span style={{color: '#e53e3e', fontStyle: 'italic'}}>
                                                    No contact found
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="modal-field">
                                        <label>Contact Method</label>
                                        <p>
                                            <FontAwesomeIcon icon={getContactMethodIcon(selectedSponsor.contactMethod || 'none')} />
                                            {selectedSponsor.contactMethod || 'None'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-section">
                                <h3>Analysis Details</h3>
                                <div className="modal-field">
                                    <label>Sponsorship Evidence</label>
                                    <p>{selectedSponsor.sponsorshipEvidence || 'No evidence provided'}</p>
                                </div>
                                <div className="modal-field">
                                    <label>Subscriber Reasoning</label>
                                    <p>{selectedSponsor.subscriberReasoning || 'No reasoning provided'}</p>
                                </div>
                                <div className="modal-field">
                                    <label>Enrichment Notes</label>
                                    <p>{selectedSponsor.enrichmentNotes || 'No notes provided'}</p>
                                </div>
                            </div>
                            
                            <div className="modal-section">
                                <h3>Tags</h3>
                                <div className="modal-tags">
                                    {selectedSponsor.tags?.map((tag, index) => (
                                        <span key={index} className="modal-tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                onClick={() => handleApprove(selectedSponsor)}
                                className="modal-btn modal-btn--approve"
                            >
                                <FontAwesomeIcon icon={faCheck} />
                                Approve Sponsor
                            </button>
                            <button 
                                onClick={() => handleDeny(selectedSponsor)}
                                className="modal-btn modal-btn--deny"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                                Deny Sponsor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;