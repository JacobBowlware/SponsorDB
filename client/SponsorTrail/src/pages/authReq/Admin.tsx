import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUsers, 
    faChartLine, 
    faClock, 
    faCheckCircle,
    faPlay,
    faCheck,
    faTimes,
    faDownload,
    faFileAlt,
    faSearch,
    faSort,
    faSortUp,
    faSortDown,
    faEye,
    faExclamationTriangle,
    faSpinner,
    faRobot,
    faRefresh,
    faExternalLink,
    faHistory,
    faChartBar
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../../config';
import './Admin.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    confidence: number;
    contactMethod: 'email' | 'partner-page' | 'media-kit' | 'none';
    estimatedSubscribers?: number;
    subscriberReasoning?: string;
    enrichmentNotes?: string;
    analysisStatus: 'complete' | 'manual_review_required' | 'pending';
    sponsorshipEvidence?: string;
    dateAdded: string;
    lastAnalyzed: string;
}

interface DashboardStats {
    totalSponsors: number;
    scrapedThisWeek: number;
    pendingReview: number;
    successRate: number;
}

interface ActivityItem {
    type: 'discovered' | 'approved' | 'rejected';
    message: string;
    details: string;
    timestamp: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const Admin = () => {
    // State management
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Table state
    const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('confidence');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    
    // Modal state
    const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{action: string, count: number} | null>(null);
    
    // Action states
    const [isRunningScraper, setIsRunningScraper] = useState(false);
    const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Fetch all dashboard data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                return;
            }

            const headers = { 'x-auth-token': token };
            
            // Fetch all data in parallel
            const [statsRes, sponsorsRes, activitiesRes] = await Promise.all([
                axios.get(`${config.backendUrl}admin/stats`, { headers }),
                axios.get(`${config.backendUrl}admin/sponsors/pending?page=${currentPage}&limit=50&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${searchTerm}&filter=${filter}`, { headers }),
                axios.get(`${config.backendUrl}admin/activity?limit=20`, { headers })
            ]);

            setStats(statsRes.data);
            setSponsors(sponsorsRes.data.sponsors);
            setPagination(sponsorsRes.data.pagination);
            setActivities(activitiesRes.data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [currentPage, sortBy, sortOrder, searchTerm, filter]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, 60000);
        
        return () => clearInterval(interval);
    }, [fetchData]);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle search and filter changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setCurrentPage(1);
            fetchData();
        }, 500);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm, filter, sortBy, sortOrder, fetchData]);

    // Run scraper
    const handleRunScraper = async () => {
        try {
            setIsRunningScraper(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}admin/scraper/run`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            if (response.data.success) {
                // Refresh data after successful run
                setTimeout(() => {
                    fetchData();
                }, 2000);
            }
        } catch (err) {
            console.error('Error running scraper:', err);
            setError('Failed to run scraper');
        } finally {
            setIsRunningScraper(false);
        }
    };

    // Handle bulk actions
    const handleBulkAction = async (action: string) => {
        if (selectedSponsors.length === 0) return;
        
        setConfirmAction({ action, count: selectedSponsors.length });
        setShowConfirmDialog(true);
    };

    const confirmBulkAction = async () => {
        if (!confirmAction) return;
        
        try {
            setIsPerformingBulkAction(true);
            const token = localStorage.getItem('token');
            
            await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                action: confirmAction.action,
                sponsorIds: selectedSponsors
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setSelectedSponsors([]);
            setShowConfirmDialog(false);
            setConfirmAction(null);
            fetchData();
        } catch (err) {
            console.error('Error performing bulk action:', err);
            setError(`Failed to ${confirmAction.action} sponsors`);
        } finally {
            setIsPerformingBulkAction(false);
        }
    };

    // Handle individual sponsor actions
    const handleApproveSponsor = async (sponsor: Sponsor) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                action: 'approve',
                sponsorIds: [sponsor._id]
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setShowModal(false);
            setSelectedSponsor(null);
            fetchData();
        } catch (err) {
            console.error('Error approving sponsor:', err);
            setError('Failed to approve sponsor');
        }
    };

    const handleRejectSponsor = async (sponsor: Sponsor) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                action: 'reject',
                sponsorIds: [sponsor._id]
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setShowModal(false);
            setSelectedSponsor(null);
            fetchData();
        } catch (err) {
            console.error('Error rejecting sponsor:', err);
            setError('Failed to reject sponsor');
        }
    };

    // Handle table sorting
    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    // Handle selection
    const handleSelectAll = () => {
        if (selectedSponsors.length === sponsors.length) {
            setSelectedSponsors([]);
        } else {
            setSelectedSponsors(sponsors.map(s => s._id));
        }
    };

    const handleSelectSponsor = (sponsorId: string) => {
        setSelectedSponsors(prev => 
            prev.includes(sponsorId) 
                ? prev.filter(id => id !== sponsorId)
                : [...prev, sponsorId]
        );
    };

    // Export CSV
    const handleExportCSV = async (type: 'pending' | 'approved' = 'pending') => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/export/csv?type=${type}`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_sponsors.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error exporting CSV:', err);
            setError('Failed to export CSV');
        }
    };

    // Get confidence color
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 85) return '#28a745';
        if (confidence >= 70) return '#ffc107';
        return '#dc3545';
    };

    // Get activity icon
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'discovered': return faRobot;
            case 'approved': return faCheckCircle;
            case 'rejected': return faTimes;
            default: return faHistory;
        }
    };

    // Get activity color
    const getActivityColor = (type: string) => {
        switch (type) {
            case 'discovered': return '#17a2b8';
            case 'approved': return '#28a745';
            case 'rejected': return '#dc3545';
            default: return '#6c757d';
        }
    };

    if (loading && !stats) {
        return (
            <div className="admin-loading">
                <div className="admin-loading__spinner"></div>
                <p>Loading Admin Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header__content">
                    <h1>Sponsor Management Dashboard</h1>
                    <p>Comprehensive sponsor review and management system</p>
                    <div className="admin-header__meta">
                        <span className="admin-header__refresh">
                            <FontAwesomeIcon icon={faRefresh} />
                            Last updated: {lastRefresh.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stats-card">
                        <div className="stats-card__icon">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div className="stats-card__content">
                            <h3>{stats.totalSponsors.toLocaleString()}</h3>
                            <p>Total Sponsors</p>
                        </div>
                    </div>
                    
                    <div className="stats-card">
                        <div className="stats-card__icon">
                            <FontAwesomeIcon icon={faChartLine} />
                        </div>
                        <div className="stats-card__content">
                            <h3>{stats.scrapedThisWeek}</h3>
                            <p>Scraped This Week</p>
                        </div>
                    </div>
                    
                    <div className="stats-card">
                        <div className="stats-card__icon">
                            <FontAwesomeIcon icon={faClock} />
                        </div>
                        <div className="stats-card__content">
                            <h3>{stats.pendingReview}</h3>
                            <p>Pending Review</p>
                        </div>
                    </div>
                    
                    <div className="stats-card">
                        <div className="stats-card__icon">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <div className="stats-card__content">
                            <h3>{stats.successRate}%</h3>
                            <p>Success Rate</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                <button 
                    className="action-btn action-btn--primary"
                    onClick={handleRunScraper}
                    disabled={isRunningScraper}
                >
                    <FontAwesomeIcon icon={isRunningScraper ? faSpinner : faPlay} spin={isRunningScraper} />
                    {isRunningScraper ? 'Running Scraper...' : 'Run Scraper Now'}
                </button>
                
                <button 
                    className="action-btn action-btn--success"
                    onClick={() => handleBulkAction('approve')}
                    disabled={selectedSponsors.length === 0 || isPerformingBulkAction}
                >
                    <FontAwesomeIcon icon={faCheck} />
                    Bulk Approve High Confidence ({selectedSponsors.length})
                </button>
                
                <button 
                    className="action-btn action-btn--info"
                    onClick={() => handleExportCSV('pending')}
                >
                    <FontAwesomeIcon icon={faDownload} />
                    Export CSV
                </button>
                
                <button 
                    className="action-btn action-btn--secondary"
                    onClick={() => handleExportCSV('approved')}
                >
                    <FontAwesomeIcon icon={faFileAlt} />
                    View Logs
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="main-content">
                {/* Sponsor Review Table */}
                <div className="sponsor-review-section">
                    <div className="section-header">
                        <h2>Sponsor Review Queue</h2>
                        <div className="table-controls">
                            <div className="search-box">
                                <FontAwesomeIcon icon={faSearch} />
                                <input
                                    type="text"
                                    placeholder="Search sponsors..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <select 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Sponsors</option>
                                <option value="high">High Confidence (85%+)</option>
                                <option value="medium">Medium Confidence (70-84%)</option>
                                <option value="low">Low Confidence (&lt;70%)</option>
                                <option value="has-contact">Has Contact Info</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="sponsor-table">
                            <thead>
                                <tr>
                                    <th className="table-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedSponsors.length === sponsors.length && sponsors.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th 
                                        className="sortable"
                                        onClick={() => handleSort('sponsorName')}
                                    >
                                        Sponsor Name & Domain
                                        <FontAwesomeIcon 
                                            icon={sortBy === 'sponsorName' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                            className={`sort-icon ${sortBy === 'sponsorName' ? 'active' : ''}`}
                                        />
                                    </th>
                                    <th 
                                        className="sortable"
                                        onClick={() => handleSort('confidence')}
                                    >
                                        Confidence
                                        <FontAwesomeIcon 
                                            icon={sortBy === 'confidence' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                            className={`sort-icon ${sortBy === 'confidence' ? 'active' : ''}`}
                                        />
                                    </th>
                                    <th>Source Newsletter</th>
                                    <th>Discovery Method</th>
                                    <th>Evidence Preview</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sponsors.map((sponsor) => (
                                    <tr key={sponsor._id}>
                                        <td className="table-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedSponsors.includes(sponsor._id)}
                                                onChange={() => handleSelectSponsor(sponsor._id)}
                                            />
                                        </td>
                                        <td className="sponsor-info">
                                            <div 
                                                className="sponsor-name"
                                                onClick={() => {
                                                    setSelectedSponsor(sponsor);
                                                    setShowModal(true);
                                                }}
                                            >
                                                {sponsor.sponsorName}
                                            </div>
                                            <div className="sponsor-domain">
                                                <a 
                                                    href={sponsor.sponsorLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                >
                                                    {sponsor.rootDomain}
                                                    <FontAwesomeIcon icon={faExternalLink} />
                                                </a>
                                            </div>
                                        </td>
                                        <td>
                                            <span 
                                                className="confidence-badge"
                                                style={{ backgroundColor: getConfidenceColor(sponsor.confidence) }}
                                            >
                                                {sponsor.confidence}%
                                            </span>
                                        </td>
                                        <td>{sponsor.newsletterSponsored}</td>
                                        <td>
                                            <span className="discovery-method">
                                                {sponsor.analysisStatus === 'complete' ? 'email_scraper' : 'manual'}
                                            </span>
                                        </td>
                                        <td className="evidence-preview">
                                            {sponsor.sponsorshipEvidence ? 
                                                sponsor.sponsorshipEvidence.substring(0, 100) + '...' : 
                                                'No evidence'
                                            }
                                        </td>
                                        <td className="table-actions">
                                            <button 
                                                className="action-btn action-btn--small action-btn--view"
                                                onClick={() => {
                                                    setSelectedSponsor(sponsor);
                                                    setShowModal(true);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button 
                                                className="action-btn action-btn--small action-btn--approve"
                                                onClick={() => handleApproveSponsor(sponsor)}
                                            >
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button 
                                                className="action-btn action-btn--small action-btn--reject"
                                                onClick={() => handleRejectSponsor(sponsor)}
                                            >
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {sponsors.length === 0 && !loading && (
                            <div className="empty-state">
                                <FontAwesomeIcon icon={faUsers} />
                                <h3>No sponsors found</h3>
                                <p>Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="pagination">
                            <button 
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            
                            <span className="pagination-info">
                                Page {currentPage} of {pagination.pages} ({pagination.total} total)
                            </span>
                            
                            <button 
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                                disabled={currentPage === pagination.pages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {/* Recent Activity Sidebar */}
                <div className="activity-sidebar">
                    <div className="section-header">
                        <h3>Recent Activity</h3>
                        <FontAwesomeIcon icon={faHistory} />
                    </div>
                    
                    <div className="activity-feed">
                        {activities.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-icon" style={{ color: getActivityColor(activity.type) }}>
                                    <FontAwesomeIcon icon={getActivityIcon(activity.type)} />
                                </div>
                                <div className="activity-content">
                                    <div className="activity-message">{activity.message}</div>
                                    <div className="activity-details">{activity.details}</div>
                                    <div className="activity-time">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="analytics-section">
                <div className="section-header">
                    <h2>Analytics Overview</h2>
                    <FontAwesomeIcon icon={faChartBar} />
                </div>
                
                <div className="analytics-grid">
                    <div className="analytics-card">
                        <h4>Top Newsletter Sources</h4>
                        <div className="analytics-content">
                            <p>Analytics coming soon...</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <h4>Confidence Distribution</h4>
                        <div className="analytics-content">
                            <p>Analytics coming soon...</p>
                        </div>
                    </div>
                    
                    <div className="analytics-card">
                        <h4>Daily Discovery Rate</h4>
                        <div className="analytics-content">
                            <p>Analytics coming soon...</p>
                        </div>
                    </div>
                </div>
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
                                <div className="modal-field">
                                    <label>Business Contact</label>
                                    <p style={{
                                        background: '#f0fff4',
                                        border: '2px solid #48bb78',
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        padding: '0.5rem',
                                        borderRadius: '8px'
                                    }}>
                                        {selectedSponsor.businessContact || 'No contact found'}
                                    </p>
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
                                onClick={() => handleApproveSponsor(selectedSponsor)}
                                className="modal-btn modal-btn--approve"
                            >
                                <FontAwesomeIcon icon={faCheck} />
                                Approve Sponsor
                            </button>
                            <button 
                                onClick={() => handleRejectSponsor(selectedSponsor)}
                                className="modal-btn modal-btn--reject"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                                Reject Sponsor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && confirmAction && (
                <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
                    <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-header">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <h3>Confirm Action</h3>
                        </div>
                        <div className="confirm-body">
                            <p>Are you sure you want to {confirmAction.action} {confirmAction.count} sponsor(s)?</p>
                            <p>This action cannot be undone.</p>
                        </div>
                        <div className="confirm-actions">
                            <button 
                                className="confirm-btn confirm-btn--cancel"
                                onClick={() => setShowConfirmDialog(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="confirm-btn confirm-btn--confirm"
                                onClick={confirmBulkAction}
                                disabled={isPerformingBulkAction}
                            >
                                {isPerformingBulkAction ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Processing...
                                    </>
                                ) : (
                                    `Yes, ${confirmAction.action}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="error-banner">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Admin;