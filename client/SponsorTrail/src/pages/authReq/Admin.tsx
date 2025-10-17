import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUsers, 
    faClock, 
    faCheckCircle,
    faTimes,
    faSearch,
    faSort,
    faSortUp,
    faSortDown,
    faExclamationTriangle,
    faSpinner,
    faRobot,
    faRefresh,
    faExternalLink,
    faEnvelope,
    faLink,
    faTrash,
    faCheck,
    faTimes as faTimesIcon,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../../config';
import EditSponsorModal from '../../components/EditSponsorModal';
import '../../css/pages/authReq/Admin.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    sponsorEmail?: string;
    sponsorApplication?: string;
    businessContact?: string;
    contactMethod: 'email' | 'application' | 'both' | 'none';
    confidence: number;
    analysisStatus: 'complete' | 'manual_review_required' | 'pending';
    dateAdded: string;
    status?: 'pending' | 'approved' | 'rejected' | 'reviewed';
    // Affiliate program fields
    isAffiliateProgram?: boolean;
    affiliateSignupLink?: string;
    commissionInfo?: string;
    interestedUsers?: string[];
}

interface DashboardStats {
    totalSponsors: number;
    pendingReview: number;
    addedThisWeek: number;
    lastScraperRun: string;
    weeklyData?: Array<{
        week: string;
        count: number;
    }>;
}

const Admin = () => {
    // State management
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Table state
    const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [sortBy, setSortBy] = useState('dateAdded');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isRunningScraper, setIsRunningScraper] = useState(false);
    const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
    const [isPerformingIndividualAction, setIsPerformingIndividualAction] = useState(false);
    const [isRunningMigration, setIsRunningMigration] = useState(false);
    const [migrationResults, setMigrationResults] = useState<any>(null);
    
    // Edit modal state
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

    // Fetch dashboard data
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
            
            // Build query parameters
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '50',
                sortBy,
                sortOrder,
                search: searchTerm,
                status: statusFilter
            });
            
            // Fetch data
            const [statsRes, sponsorsRes] = await Promise.all([
                axios.get(`${config.backendUrl}admin/stats`, { headers }),
                axios.get(`${config.backendUrl}admin/sponsors/all?${queryParams}`, { headers })
            ]);

            setStats({
                totalSponsors: statsRes.data.totalSponsors,
                pendingReview: statsRes.data.pendingReview,
                addedThisWeek: statsRes.data.scrapedThisWeek,
                lastScraperRun: new Date().toLocaleString()
            });
            setSponsors(sponsorsRes.data.sponsors);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [currentPage, sortBy, sortOrder, searchTerm, statusFilter]);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Run scraper
    const handleRunScraper = async () => {
        try {
            setIsRunningScraper(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}admin/scraper/run`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            if (response.data.success) {
                setTimeout(() => {
                    fetchData();
                }, 2000);
            }
        } catch (err: any) {
            console.error('Error running scraper:', err);
            setError('Failed to run scraper');
        } finally {
            setIsRunningScraper(false);
        }
    };

    // Run migration
    const handleRunMigration = async () => {
        try {
            setIsRunningMigration(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}admin/migrate-affiliate-sponsors`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            setMigrationResults(response.data.results);
            console.log('Affiliate migration completed:', response.data);
            
            // Refresh data after migration
            setTimeout(() => {
                fetchData();
            }, 1000);
        } catch (err: any) {
            console.error('Error running affiliate migration:', err);
            setError('Failed to run affiliate migration');
        } finally {
            setIsRunningMigration(false);
        }
    };


    // Handle bulk actions
    const handleBulkAction = async (action: string) => {
        if (selectedSponsors.length === 0) return;
        
        try {
            setIsPerformingBulkAction(true);
            const token = localStorage.getItem('token');
            
            if (action === 'reject') {
                // For bulk reject, show confirmation dialog
                const confirmed = window.confirm(
                    `Reject and block ${selectedSponsors.length} sponsors forever?\n\nThis will:\n- Permanently block all domains from future scraping\n- Remove all sponsors from the database\n\nThis action cannot be undone.`
                );
                
                if (!confirmed) {
                    setIsPerformingBulkAction(false);
                    return;
                }
            }
            
            await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                action,
                sponsorIds: selectedSponsors
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setSelectedSponsors([]);
            fetchData();
        } catch (err: any) {
            console.error('Error performing bulk action:', err);
            setError(`Failed to ${action} sponsors`);
        } finally {
            setIsPerformingBulkAction(false);
        }
    };

    // Handle individual sponsor actions
    const handleSponsorAction = async (sponsorId: string, action: string) => {
        console.log('Admin: handleSponsorAction called with:', { sponsorId, action });
        console.log('Admin: Current sponsors state:', sponsors.length, 'sponsors loaded');
        
        try {
            setIsPerformingIndividualAction(true);
            const token = localStorage.getItem('token');
            console.log('Admin: Token available:', !!token);
            console.log('Admin: Making API call for individual sponsor action:', action);
            
            if (action === 'reject') {
                // For reject action, show confirmation dialog
                const sponsor = sponsors.find(s => s._id === sponsorId);
                if (sponsor) {
                    const confirmed = window.confirm(
                        `Reject and block ${sponsor.rootDomain} forever?\n\nThis will:\n- Permanently block the domain from future scraping\n- Remove the sponsor from the database\n\nThis action cannot be undone.`
                    );
                    
                    if (!confirmed) {
                        setIsPerformingIndividualAction(false);
                        return;
                    }
                    
                    // Call deny-domain API
                    await axios.post(`${config.backendUrl}admin/deny-domain`, {
                        rootDomain: sponsor.rootDomain,
                        reason: 'Rejected by admin'
                    }, {
                        headers: { 'x-auth-token': token }
                    });
                    
                    // Also remove from potential sponsors
                    await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                        action: 'reject',
                        sponsorIds: [sponsorId]
                    }, {
                        headers: { 'x-auth-token': token }
                    });
                }
            } else {
                // For other actions, use the existing bulk action
                console.log('Admin: Calling bulk-action API with:', { action, sponsorIds: [sponsorId] });
                console.log('Admin: API endpoint:', `${config.backendUrl}admin/sponsors/bulk-action`);
                
                const response = await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                    action,
                    sponsorIds: [sponsorId]
                }, {
                    headers: { 'x-auth-token': token }
                });
                
                console.log('Admin: API response:', response.status, response.data);
            }
            
            console.log('Admin: Action completed, refreshing data...');
            fetchData();
        } catch (err: any) {
            console.error(`Error ${action}ing sponsor:`, err);
            console.error('Admin: Full error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                action,
                sponsorId
            });
            setError(`Failed to ${action} sponsor: ${err.message}`);
        } finally {
            console.log('Admin: Setting isPerformingIndividualAction to false');
            setIsPerformingIndividualAction(false);
        }
    };

    // Handle edit sponsor
    const handleEditSponsor = (sponsor: Sponsor) => {
        setEditingSponsor(sponsor);
    };

    // Handle save sponsor
    const handleSaveSponsor = async (updatedSponsor: Sponsor) => {
        console.log('Admin: handleSaveSponsor called with:', updatedSponsor);
        try {
            const token = localStorage.getItem('token');
            console.log('Admin: Making API call to update sponsor');
            
            const response = await axios.put(`${config.backendUrl}sponsors/${updatedSponsor._id}`, {
                sponsorName: updatedSponsor.sponsorName,
                sponsorLink: updatedSponsor.sponsorLink,
                rootDomain: updatedSponsor.rootDomain,
                tags: updatedSponsor.tags,
                newsletterSponsored: updatedSponsor.newsletterSponsored,
                subscriberCount: updatedSponsor.subscriberCount,
                sponsorEmail: updatedSponsor.sponsorEmail,
                sponsorApplication: updatedSponsor.sponsorApplication,
                contactMethod: updatedSponsor.contactMethod
            }, {
                headers: { 'x-auth-token': token }
            });

            if (response.status === 200) {
                // Update the sponsor in the local state
                setSponsors(prev => prev.map(sponsor => 
                    sponsor._id === updatedSponsor._id ? updatedSponsor : sponsor
                ));
                setEditingSponsor(null);
            }
        } catch (err: any) {
            console.error('Error saving sponsor:', err);
            setError('Failed to save sponsor changes');
        }
    };

    // Handle close edit modal
    const handleCloseEditModal = () => {
        setEditingSponsor(null);
    };

    // Handle table sorting
    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
        // Reset to first page when sorting changes
        setCurrentPage(1);
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


    // Get status badge info
    const getStatusBadge = (sponsor: Sponsor) => {
        if (sponsor.status === 'approved') {
            return { text: 'Complete', color: '#28a745', icon: faCheckCircle };
        } else if (sponsor.status === 'rejected') {
            return { text: 'Rejected', color: '#dc3545', icon: faTimes };
        } else if (sponsor.analysisStatus === 'manual_review_required') {
            return { text: 'Manual Review', color: '#ffc107', icon: faExclamationTriangle };
        } else {
            return { text: 'Pending', color: '#6c757d', icon: faClock };
        }
    };

    // Get contact info display
    const getContactDisplay = (sponsor: Sponsor) => {
        const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim();
        const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim();
        
        if (hasEmail && hasApplication) {
            return (
                <div className="contact-both">
                    <div className="contact-item">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <span>{sponsor.sponsorEmail}</span>
                    </div>
                    <div className="contact-item">
                        <FontAwesomeIcon icon={faLink} />
                        <a href={sponsor.sponsorApplication} target="_blank" rel="noopener noreferrer">
                            Application
                        </a>
                    </div>
                </div>
            );
        } else if (hasEmail) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span>{sponsor.sponsorEmail}</span>
                </div>
            );
        } else if (hasApplication) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faLink} />
                    <a href={sponsor.sponsorApplication} target="_blank" rel="noopener noreferrer">
                        Application
                    </a>
                </div>
            );
        } else {
            return <span className="no-contact">No contact</span>;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
        <div className="admin-page">
            <div className="admin-dashboard">
                {/* Header */}
                <div className="admin-header">
                    <div className="admin-header-content">
                        <h1>Sponsor Management</h1>
                        <p className="admin-subtitle">Manage sponsors, review pending entries, and monitor system activity</p>
                    </div>
                    <div className="admin-actions">
                        <h1>
                            THIS BUTTON IS CHANGED?
                        </h1>
                        <button 
                            className="btn btn-warning"
                            onClick={handleRunMigration}
                            disabled={isRunningMigration}
                        >
                            <FontAwesomeIcon icon={isRunningMigration ? faSpinner : faLink} spin={isRunningMigration} />
                            {isRunningMigration ? 'Migrating...' : 'Migrate Affiliates'}
                        </button>
                        <button 
                            className="btn btn-primary"
                            onClick={handleRunScraper}
                            disabled={isRunningScraper}
                        >
                            <FontAwesomeIcon icon={isRunningScraper ? faSpinner : faRobot} spin={isRunningScraper} />
                            {isRunningScraper ? 'Running...' : 'Run Scraper'}
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={fetchData}
                            disabled={loading}
                        >
                            <FontAwesomeIcon icon={faRefresh} spin={loading} />
                            Refresh
                        </button>
                    </div>
                </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div className="stat-content">
                            <h3>{stats.totalSponsors?.toLocaleString() || '0'}</h3>
                            <p>Total Sponsors</p>
                        </div>
                    </div>
                    
                    <div className="stat-card stat-card--success">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <div className="stat-content">
                            <h3>{sponsors.filter(s => s.contactMethod && s.contactMethod !== 'none').length}</h3>
                            <p>With Contact Info</p>
                        </div>
                    </div>
                    
                    <div className="stat-card stat-card--warning">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                        </div>
                        <div className="stat-content">
                            <h3>{sponsors.filter(s => !s.contactMethod || s.contactMethod === 'none').length}</h3>
                            <p>Need Contact Info</p>
                        </div>
                    </div>
                    
                    <div className="stat-card stat-card--info">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faRobot} />
                        </div>
                        <div className="stat-content">
                            <h3>Active</h3>
                            <p>Last Run: {stats.lastScraperRun || 'Never'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Chart */}
            {stats && stats.weeklyData && stats.weeklyData.length > 0 && (
                <div className="chart-section">
                    <div className="chart-header">
                        <h3>Weekly Sponsor Additions</h3>
                        <p>Track how many sponsors our scraper has added each week</p>
                    </div>
                    <div className="chart-container">
                        <div className="weekly-chart">
                            {stats.weeklyData.map((week, index) => (
                                <div key={week.week} className="chart-bar">
                                    <div 
                                        className="bar-fill" 
                                        style={{ 
                                            height: `${Math.max((week.count / Math.max(...(stats.weeklyData || []).map(w => w.count), 1)) * 100, 5)}%` 
                                        }}
                                    ></div>
                                    <div className="bar-label">{week.week}</div>
                                    <div className="bar-value">{week.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                        type="text"
                        placeholder="Search sponsors, newsletters, domains..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="filter-group">
                    <label>Status</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Need Contact Info</option>
                        <option value="complete">With Contact Info</option>
                        <option value="manual_review_required">Manual Review Required</option>
                    </select>
                </div>
                
                <div className="filter-group">
                    <label>Source</label>
                    <select 
                        value={sourceFilter} 
                        onChange={(e) => setSourceFilter(e.target.value)}
                    >
                        <option value="all">All Sources</option>
                        {/* Add dynamic newsletter options here */}
                    </select>
                </div>
                
                <div className="filter-group">
                    <label>Added</label>
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>


            {/* Bulk Actions */}
            {selectedSponsors.length > 0 && (
                <div className="bulk-actions">
                    <div className="selected-count">
                        {selectedSponsors.length} selected
                    </div>
                    <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleBulkAction('approve')}
                        disabled={isPerformingBulkAction}
                    >
                        <FontAwesomeIcon icon={faCheck} />
                        Approve All
                    </button>
                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleBulkAction('mark-complete')}
                        disabled={isPerformingBulkAction}
                    >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Mark as Complete
                    </button>
                    <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleBulkAction('reject')}
                        disabled={isPerformingBulkAction}
                    >
                        <FontAwesomeIcon icon={faTimesIcon} />
                        Reject All
                    </button>
                    <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedSponsors([])}
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {/* Main Table */}
            <div className="table-container">
                <table className="sponsor-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedSponsors.length === sponsors.length && sponsors.length > 0}
                                    onChange={handleSelectAll}
                                    style={{ transform: 'scale(1.2)' }}
                                />
                            </th>
                            <th 
                                className="sortable"
                                onClick={() => handleSort('sponsorName')}
                            >
                                Sponsor Name
                                <FontAwesomeIcon 
                                    icon={sortBy === 'sponsorName' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                    className={`sort-icon ${sortBy === 'sponsorName' ? 'active' : ''}`}
                                />
                            </th>
                            <th>Domain</th>
                            <th>Email/Application</th>
                            <th>Status</th>
                            <th 
                                className="sortable"
                                onClick={() => handleSort('newsletterSponsored')}
                            >
                                Source
                                <FontAwesomeIcon 
                                    icon={sortBy === 'newsletterSponsored' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                    className={`sort-icon ${sortBy === 'newsletterSponsored' ? 'active' : ''}`}
                                />
                            </th>
                            <th 
                                className="sortable"
                                onClick={() => handleSort('subscriberCount')}
                            >
                                Audience
                                <FontAwesomeIcon 
                                    icon={sortBy === 'subscriberCount' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                    className={`sort-icon ${sortBy === 'subscriberCount' ? 'active' : ''}`}
                                />
                            </th>
                            <th 
                                className="sortable"
                                onClick={() => handleSort('dateAdded')}
                            >
                                Added Date
                                <FontAwesomeIcon 
                                    icon={sortBy === 'dateAdded' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                    className={`sort-icon ${sortBy === 'dateAdded' ? 'active' : ''}`}
                                />
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sponsors.map((sponsor) => {
                            const statusBadge = getStatusBadge(sponsor);
                            
                            return (
                                <tr 
                                    key={sponsor._id}
                                    onDoubleClick={() => handleEditSponsor(sponsor)}
                                    className="sponsor-row"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedSponsors.includes(sponsor._id)}
                                            onChange={() => handleSelectSponsor(sponsor._id)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ transform: 'scale(1.2)' }}
                                        />
                                    </td>
                                    <td className="sponsor-name">
                                        <div 
                                            className="sponsor-name-link"
                                            onClick={() => window.open(`https://${sponsor.rootDomain}`, '_blank')}
                                        >
                                            {sponsor.sponsorName}
                                            <FontAwesomeIcon icon={faExternalLink} />
                                        </div>
                                    </td>
                                    <td className="domain">
                                        {sponsor.rootDomain}
                                    </td>
                                    <td className="contact-info">
                                        {getContactDisplay(sponsor)}
                                    </td>
                                    <td>
                                        <span 
                                            className="status-badge"
                                            style={{ backgroundColor: statusBadge.color }}
                                        >
                                            <FontAwesomeIcon icon={statusBadge.icon} />
                                            {statusBadge.text}
                                        </span>
                                    </td>
                                    <td className="source">
                                        {sponsor.newsletterSponsored}
                                    </td>
                                    <td className="audience">
                                        {sponsor.subscriberCount ? sponsor.subscriberCount.toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="date">
                                        {formatDate(sponsor.dateAdded)}
                                    </td>
                                    <td className="actions">
                                        <button 
                                            className="btn btn-sm btn-primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditSponsor(sponsor);
                                            }}
                                            title="Edit Sponsor"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        {sponsor.status === 'pending' || sponsor.analysisStatus === 'pending' ? (
                                            <>
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log('Admin: Approve button clicked for sponsor:', sponsor._id, sponsor.sponsorName, 'Status:', sponsor.status, 'Analysis Status:', sponsor.analysisStatus);
                                                        handleSponsorAction(sponsor._id, 'approve');
                                                    }}
                                                    disabled={isPerformingIndividualAction}
                                                    title="Approve"
                                                >
                                                    <FontAwesomeIcon icon={isPerformingIndividualAction ? faSpinner : faCheck} spin={isPerformingIndividualAction} />
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSponsorAction(sponsor._id, 'reject');
                                                    }}
                                                    disabled={isPerformingIndividualAction}
                                                    title="Reject"
                                                >
                                                    <FontAwesomeIcon icon={isPerformingIndividualAction ? faSpinner : faTimesIcon} spin={isPerformingIndividualAction} />
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSponsorAction(sponsor._id, 'delete');
                                                }}
                                                disabled={isPerformingIndividualAction}
                                                title="Remove from Database"
                                            >
                                                <FontAwesomeIcon icon={isPerformingIndividualAction ? faSpinner : faTrash} spin={isPerformingIndividualAction} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
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

            {/* Migration Results */}
            {migrationResults && (
                <div className="migration-results">
                    <h3>Affiliate Migration Results</h3>
                    <div className="migration-stats">
                        <div className="migration-stat">
                            <strong>Total Processed:</strong> {migrationResults.totalProcessed} sponsors
                        </div>
                        <div className="migration-stat">
                            <strong>Successfully Migrated:</strong> {migrationResults.migratedCount} sponsors
                        </div>
                        <div className="migration-stat">
                            <strong>Skipped:</strong> {migrationResults.skippedCount} sponsors
                        </div>
                        <div className="migration-stat">
                            <strong>Errors:</strong> {migrationResults.errors} errors
                        </div>
                    </div>
                    {migrationResults.details && migrationResults.details.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <h4>Migration Details:</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12px' }}>
                                {migrationResults.details.map((detail: any, index: number) => (
                                    <div key={index} style={{ marginBottom: '4px', padding: '4px', background: '#f0f9ff', borderRadius: '4px' }}>
                                        <strong>{detail.sponsor}:</strong> {detail.action}
                                        {detail.value && <span> - {detail.value}</span>}
                                        {detail.error && <span style={{ color: '#dc2626' }}> - Error: {detail.error}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => setMigrationResults(null)}
                    >
                        Dismiss
                    </button>
                </div>
            )}


            {/* Error Display */}
            {error && (
                <div className="error-banner">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>
                        <FontAwesomeIcon icon={faTimesIcon} />
                    </button>
                </div>
            )}

            {/* Edit Sponsor Modal */}
            {editingSponsor && (
                <EditSponsorModal
                    sponsor={editingSponsor}
                    onClose={handleCloseEditModal}
                    onSave={handleSaveSponsor}
                />
            )}
            </div>
        </div>
    );
};

export default Admin;