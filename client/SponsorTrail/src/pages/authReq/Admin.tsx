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
    faEdit,
    faList,
    faDatabase,
    faPaperPlane,
    faNewspaper,
    faSave,
    faHistory,
    faEye,
    faEyeSlash
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
    dateAdded: string;
    status: 'pending' | 'approved';
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
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [consolidationResults, setConsolidationResults] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportResults, setExportResults] = useState<any>(null);
    const [showAllSponsors, setShowAllSponsors] = useState(false);
    
    // Test email state
    const [testEmail, setTestEmail] = useState('');
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
    const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
    
    // Edit modal state
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    
    // Newsletter state
    const [newsletters, setNewsletters] = useState<any[]>([]);
    const [currentNewsletter, setCurrentNewsletter] = useState<any | null>(null);
    const [isGeneratingNewsletter, setIsGeneratingNewsletter] = useState(false);
    const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
    const [isSavingNewsletter, setIsSavingNewsletter] = useState(false);
    const [newsletterSubscriberCount, setNewsletterSubscriberCount] = useState<number | null>(null);
    const [newsletterFilter, setNewsletterFilter] = useState<'all' | 'draft' | 'sent'>('all');

    // Status filter options
    const STATUS_FILTERS = [
        { key: 'all', label: 'All Sponsors', icon: faDatabase, color: '#6B7280' },
        { key: 'approved', label: 'Approved', icon: faCheckCircle, color: '#10B981' },
        { key: 'pending', label: 'Pending', icon: faClock, color: '#F59E0B' },
        { key: 'with_contact', label: 'With Contact Info', icon: faEnvelope, color: '#3B82F6' },
        { key: 'no_contact', label: 'No Contact Info', icon: faTimes, color: '#EF4444' }
    ];

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
                page: showAllSponsors ? '1' : currentPage.toString(),
                limit: showAllSponsors ? '1000' : '200',
                sortBy,
                sortOrder,
                search: searchTerm,
                status: statusFilter === 'all' ? '' : statusFilter
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
            
            // Apply client-side filtering for contact-based filters
            let filteredSponsors = sponsorsRes.data.sponsors;
            
            if (statusFilter === 'with_contact') {
                filteredSponsors = filteredSponsors.filter((sponsor: Sponsor) => hasContactInfo(sponsor));
            } else if (statusFilter === 'no_contact') {
                filteredSponsors = filteredSponsors.filter((sponsor: Sponsor) => !hasContactInfo(sponsor));
            }
            
            setSponsors(filteredSponsors);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [currentPage, sortBy, sortOrder, searchTerm, statusFilter, showAllSponsors]);

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

    // Consolidate sponsor data
    const handleConsolidate = async () => {
        try {
            setIsConsolidating(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}admin/consolidate-sponsors`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            setConsolidationResults(response.data.results);
            console.log('Consolidation completed:', response.data);
            
            // Refresh data after consolidation
            setTimeout(() => {
                fetchData();
            }, 1000);
        } catch (err: any) {
            console.error('Error consolidating sponsors:', err);
            setError('Failed to npm run sponsor data');
        } finally {
            setIsConsolidating(false);
        }
    };

    // Test sponsor count
    const handleTestCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/test-sponsor-count`, {
                headers: { 'x-auth-token': token }
            });

            console.log('Sponsor count test:', response.data);
            alert(`Total sponsors in database: ${response.data.totalCount}\nSample: ${JSON.stringify(response.data.sampleSponsors, null, 2)}`);
        } catch (err: any) {
            console.error('Error testing sponsor count:', err);
            setError('Failed to test sponsor count');
        }
    };

    // Handle test email
    const handleTestEmail = async () => {
        if (!testEmail.trim()) {
            setTestEmailResult('Please enter an email address');
            return;
        }

        try {
            setIsSendingTestEmail(true);
            setTestEmailResult(null);
            
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}users/test-email`, {
                email: testEmail.trim()
            }, {
                headers: { 'x-auth-token': token }
            });

            setTestEmailResult('Test email sent successfully!');
            setTestEmail(''); // Clear the input
        } catch (err: any) {
            console.error('Error sending test email:', err);
            setTestEmailResult(`Failed to send test email: ${err.response?.data?.error || err.message}`);
        } finally {
            setIsSendingTestEmail(false);
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
            
            const response = await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                action,
                sponsorIds: selectedSponsors
            }, {
                headers: { 'x-auth-token': token }
            });
            
            console.log('Bulk action response:', response.data);
            
            setSelectedSponsors([]);
            // Small delay to ensure database operations complete before refetching
            setTimeout(() => {
                fetchData();
            }, 100);
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
                    
                    // Use bulk-action endpoint which handles blacklisting and deletion
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
            
            // Build payload and log it before sending
            const payload = {
                sponsorName: updatedSponsor.sponsorName,
                sponsorLink: updatedSponsor.sponsorLink,
                rootDomain: updatedSponsor.rootDomain,
                tags: updatedSponsor.tags,
                newsletterSponsored: updatedSponsor.newsletterSponsored,
                subscriberCount: updatedSponsor.subscriberCount,
                sponsorEmail: updatedSponsor.sponsorEmail,
                sponsorApplication: updatedSponsor.sponsorApplication,
                businessContact: updatedSponsor.businessContact,
                contactMethod: updatedSponsor.contactMethod,
                status: updatedSponsor.status,
                isAffiliateProgram: updatedSponsor.isAffiliateProgram,
                affiliateSignupLink: updatedSponsor.affiliateSignupLink,
                commissionInfo: updatedSponsor.commissionInfo
            };
            console.log('Admin: Sending sponsor update payload:', payload);

            // Send all fields including status, businessContact, and affiliate fields
            const response = await axios.put(`${config.backendUrl}sponsors/${updatedSponsor._id}`, payload, {
                headers: { 'x-auth-token': token }
            });

            if (response.status === 200) {
                // Update the sponsor in the local state
                const saved = response.data as Sponsor;
                setSponsors(prev => prev.map(sponsor => 
                    sponsor._id === saved._id ? { ...sponsor, ...saved } : sponsor
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

    // Newsletter functions
    const fetchNewsletters = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/newsletter/list`, {
                headers: { 'x-auth-token': token }
            });
            if (response.data.success) {
                setNewsletters(response.data.newsletters);
            }
        } catch (error) {
            console.error('Error fetching newsletters:', error);
            setError('Failed to load newsletters');
        }
    };

    const fetchSubscriberCount = async () => {
        try {
            const token = localStorage.getItem('token');
            // We'll estimate subscriber count from the send endpoint response
            // For now, we'll use a placeholder - in production, you might want a separate endpoint
            setNewsletterSubscriberCount(null); // Will be set when generating
        } catch (error) {
            console.error('Error fetching subscriber count:', error);
        }
    };

    const handleGenerateNewsletter = async () => {
        try {
            setIsGeneratingNewsletter(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}admin/newsletter/generate`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            if (response.data.success) {
                setCurrentNewsletter(response.data.newsletter);
                // Estimate subscriber count (we'll get actual count when sending)
                // For now, we'll fetch it separately or estimate
                fetchSubscriberCount();
            }
        } catch (error: any) {
            console.error('Error generating newsletter:', error);
            setError(error.response?.data?.error || 'Failed to generate newsletter');
        } finally {
            setIsGeneratingNewsletter(false);
        }
    };

    const handleRegenerateNewsletter = async () => {
        await handleGenerateNewsletter();
    };

    const handleSaveNewsletter = async () => {
        if (!currentNewsletter) return;
        
        try {
            setIsSavingNewsletter(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${config.backendUrl}admin/newsletter/update/${currentNewsletter._id}`,
                {
                    subject: currentNewsletter.subject,
                    sponsors: currentNewsletter.sponsors.map((s: any) => s._id || s)
                },
                {
                    headers: { 'x-auth-token': token }
                }
            );
            
            if (response.data.success) {
                setCurrentNewsletter(response.data.newsletter);
                await fetchNewsletters();
                alert('Newsletter saved as draft successfully!');
            }
        } catch (error: any) {
            console.error('Error saving newsletter:', error);
            setError(error.response?.data?.error || 'Failed to save newsletter');
        } finally {
            setIsSavingNewsletter(false);
        }
    };

    const handleSendNewsletter = async () => {
        if (!currentNewsletter) return;
        
        const confirmed = window.confirm(
            `Send this newsletter to all subscribers?\n\nSubject: ${currentNewsletter.subject}\n\nThis action cannot be undone.`
        );
        
        if (!confirmed) return;

        try {
            setIsSendingNewsletter(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${config.backendUrl}admin/newsletter/send/${currentNewsletter._id}`,
                {},
                {
                    headers: { 'x-auth-token': token }
                }
            );
            
            if (response.data.success) {
                alert(`Newsletter sent successfully!\n\nSent to: ${response.data.sentCount} subscribers\nFailed: ${response.data.failedCount}`);
                setCurrentNewsletter(null);
                await fetchNewsletters();
            }
        } catch (error: any) {
            console.error('Error sending newsletter:', error);
            setError(error.response?.data?.error || 'Failed to send newsletter');
        } finally {
            setIsSendingNewsletter(false);
        }
    };

    const handleDeleteNewsletter = async (newsletterId: string) => {
        const confirmed = window.confirm('Delete this newsletter draft? This action cannot be undone.');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            // Note: You may need to add a delete endpoint, or we can just remove from state
            // For now, we'll just remove from local state if it's a draft
            setNewsletters(prev => prev.filter(n => n._id !== newsletterId));
        } catch (error: any) {
            console.error('Error deleting newsletter:', error);
            setError('Failed to delete newsletter');
        }
    };

    const handleEditNewsletter = async (newsletter: any) => {
        // Fetch full newsletter with populated sponsors
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/newsletter/list`, {
                headers: { 'x-auth-token': token }
            });
            if (response.data.success) {
                const fullNewsletter = response.data.newsletters.find((n: any) => n._id === newsletter._id);
                if (fullNewsletter) {
                    setCurrentNewsletter(fullNewsletter);
                } else {
                    setCurrentNewsletter(newsletter);
                }
            } else {
                setCurrentNewsletter(newsletter);
            }
        } catch (error) {
            console.error('Error fetching newsletter details:', error);
            setCurrentNewsletter(newsletter);
        }
    };

    // Fetch newsletters on component mount
    useEffect(() => {
        fetchNewsletters();
    }, []);

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
            return { text: 'Approved', color: '#28a745', icon: faCheckCircle };
        } else {
            return { text: 'Pending', color: '#6c757d', icon: faClock };
        }
    };

    // Helper function to check if sponsor has contact info (matches consolidation script logic)
    const hasContactInfo = (sponsor: Sponsor) => {
        const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
        const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';
        const hasAffiliateLink = sponsor.affiliateSignupLink && sponsor.affiliateSignupLink.trim() !== '';
        const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';
        
        return hasEmail || hasApplication || hasAffiliateLink || hasBusinessContact;
    };

    // Get contact info display
    const getContactDisplay = (sponsor: Sponsor) => {
        const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim();
        const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim();
        const hasAffiliateLink = sponsor.affiliateSignupLink && sponsor.affiliateSignupLink.trim();
        const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim();
        
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
        } else if (hasAffiliateLink) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faLink} />
                    <a href={sponsor.affiliateSignupLink} target="_blank" rel="noopener noreferrer">
                        Affiliate Program
                    </a>
                </div>
            );
        } else if (hasBusinessContact) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faLink} />
                    <span>{sponsor.businessContact}</span>
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
                        <button 
                            className="btn btn-success"
                            onClick={handleConsolidate}
                            disabled={isConsolidating}
                        >
                            <FontAwesomeIcon icon={isConsolidating ? faSpinner : faDatabase} spin={isConsolidating} />
                            {isConsolidating ? 'Consolidating...' : 'Consolidate Data'}
                        </button>
                        <button 
                            className="btn btn-info"
                            onClick={handleTestCount}
                        >
                            <FontAwesomeIcon icon={faSearch} />
                            Test Count
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
                            className={`btn ${showAllSponsors ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => setShowAllSponsors(!showAllSponsors)}
                        >
                            <FontAwesomeIcon icon={faList} />
                            {showAllSponsors ? 'Show Paginated' : 'Show All Sponsors'}
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

                {/* Test Email Section */}
                <div className="admin-test-email">
                    <div className="test-email-header">
                        <h3>Test Email System</h3>
                        <p>Send a test email to verify the email system is working correctly</p>
                    </div>
                    <div className="test-email-form">
                        <input
                            type="email"
                            placeholder="Enter email address to test"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="test-email-input"
                            disabled={isSendingTestEmail}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleTestEmail}
                            disabled={isSendingTestEmail || !testEmail.trim()}
                        >
                            <FontAwesomeIcon icon={isSendingTestEmail ? faSpinner : faPaperPlane} spin={isSendingTestEmail} />
                            {isSendingTestEmail ? 'Sending...' : 'Send Test Email'}
                        </button>
                    </div>
                    {testEmailResult && (
                        <div className={`test-email-result ${testEmailResult.includes('successfully') ? 'success' : 'error'}`}>
                            {testEmailResult}
                        </div>
                    )}
                </div>

                {/* Newsletter Management Section */}
                <div className="admin-newsletter-section">
                    <div className="newsletter-header">
                        <FontAwesomeIcon icon={faNewspaper} />
                        <h2>Newsletter Management</h2>
                    </div>

                    {/* Create & Send Newsletter */}
                    <div className="newsletter-create-section">
                        <div className="section-header">
                            <h3>Create & Send Newsletter</h3>
                            {!currentNewsletter && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleGenerateNewsletter}
                                    disabled={isGeneratingNewsletter}
                                >
                                    <FontAwesomeIcon icon={isGeneratingNewsletter ? faSpinner : faNewspaper} spin={isGeneratingNewsletter} />
                                    {isGeneratingNewsletter ? 'Generating...' : 'Generate Newsletter'}
                                </button>
                            )}
                        </div>

                        {currentNewsletter && (
                            <div className="newsletter-preview">
                                <div className="newsletter-preview-header">
                                    <h4>Newsletter Preview</h4>
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setCurrentNewsletter(null)}
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                        Close
                                    </button>
                                </div>

                                <div className="newsletter-preview-content">
                                    <div className="newsletter-field">
                                        <label>Subject Line</label>
                                        <input
                                            type="text"
                                            value={currentNewsletter.subject}
                                            onChange={(e) => setCurrentNewsletter({
                                                ...currentNewsletter,
                                                subject: e.target.value
                                            })}
                                            className="newsletter-subject-input"
                                            placeholder="Enter newsletter subject"
                                        />
                                    </div>

                                    <div className="newsletter-sponsors">
                                        <label>Selected Sponsors ({currentNewsletter.sponsors?.length || 0})</label>
                                        <div className="sponsors-list">
                                            {currentNewsletter.sponsors?.map((sponsor: any, index: number) => (
                                                <div key={sponsor._id || index} className="sponsor-item">
                                                    <div className="sponsor-info">
                                                        <strong>{sponsor.sponsorName || 'Unknown Sponsor'}</strong>
                                                        <div className="sponsor-contact">
                                                            {sponsor.sponsorEmail && (
                                                                <span className="contact-badge email">
                                                                    <FontAwesomeIcon icon={faEnvelope} />
                                                                    Email
                                                                </span>
                                                            )}
                                                            {sponsor.sponsorApplication && (
                                                                <span className="contact-badge application">
                                                                    <FontAwesomeIcon icon={faLink} />
                                                                    Application
                                                                </span>
                                                            )}
                                                            {sponsor.sponsorLink && (
                                                                <a href={sponsor.sponsorLink} target="_blank" rel="noopener noreferrer" className="sponsor-link">
                                                                    <FontAwesomeIcon icon={faExternalLink} />
                                                                    View
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="newsletter-subscriber-info">
                                        <FontAwesomeIcon icon={faUsers} />
                                        <span>Will be sent to subscribers (count will be shown when sending)</span>
                                    </div>

                                    <div className="newsletter-actions">
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={handleRegenerateNewsletter}
                                            disabled={isGeneratingNewsletter}
                                        >
                                            <FontAwesomeIcon icon={faRefresh} spin={isGeneratingNewsletter} />
                                            Regenerate
                                        </button>
                                        <button 
                                            className="btn btn-info"
                                            onClick={handleSaveNewsletter}
                                            disabled={isSavingNewsletter || currentNewsletter.status === 'sent'}
                                        >
                                            <FontAwesomeIcon icon={isSavingNewsletter ? faSpinner : faSave} spin={isSavingNewsletter} />
                                            {isSavingNewsletter ? 'Saving...' : 'Save as Draft'}
                                        </button>
                                        <button 
                                            className="btn btn-success"
                                            onClick={handleSendNewsletter}
                                            disabled={isSendingNewsletter || currentNewsletter.status === 'sent'}
                                        >
                                            <FontAwesomeIcon icon={isSendingNewsletter ? faSpinner : faPaperPlane} spin={isSendingNewsletter} />
                                            {isSendingNewsletter ? 'Sending...' : 'Send Now'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Newsletter History */}
                    <div className="newsletter-history-section">
                        <div className="section-header">
                            <h3>Newsletter History</h3>
                            <div className="newsletter-filter">
                                <button
                                    className={`filter-btn ${newsletterFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setNewsletterFilter('all')}
                                >
                                    All
                                </button>
                                <button
                                    className={`filter-btn ${newsletterFilter === 'draft' ? 'active' : ''}`}
                                    onClick={() => setNewsletterFilter('draft')}
                                >
                                    Drafts
                                </button>
                                <button
                                    className={`filter-btn ${newsletterFilter === 'sent' ? 'active' : ''}`}
                                    onClick={() => setNewsletterFilter('sent')}
                                >
                                    Sent
                                </button>
                            </div>
                        </div>

                        <div className="newsletter-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Date Sent</th>
                                        <th>Recipients</th>
                                        <th>Sponsors</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newsletters
                                        .filter(n => newsletterFilter === 'all' || n.status === newsletterFilter)
                                        .map((newsletter) => (
                                        <tr key={newsletter._id}>
                                            <td>{newsletter.subject}</td>
                                            <td>
                                                {newsletter.sentAt 
                                                    ? new Date(newsletter.sentAt).toLocaleDateString()
                                                    : newsletter.createdAt
                                                        ? new Date(newsletter.createdAt).toLocaleDateString()
                                                        : 'N/A'
                                                }
                                            </td>
                                            <td>{newsletter.recipientCount || 0}</td>
                                            <td>{newsletter.sponsors?.length || 0}</td>
                                            <td>
                                                <span className={`status-badge ${newsletter.status}`}>
                                                    {newsletter.status === 'sent' ? 'Sent' : 'Draft'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="newsletter-action-buttons">
                                                    {newsletter.status === 'draft' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => handleEditNewsletter(newsletter)}
                                                                title="Edit & Send"
                                                            >
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDeleteNewsletter(newsletter._id)}
                                                                title="Delete"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {newsletter.status === 'sent' && (
                                                        <span className="text-muted">Sent</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {newsletters.filter(n => newsletterFilter === 'all' || n.status === newsletterFilter).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center">
                                                No newsletters found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                            <h3>{sponsors.filter(s => hasContactInfo(s)).length}</h3>
                            <p>With Contact Info</p>
                        </div>
                    </div>
                    
                    <div className="stat-card stat-card--warning">
                        <div className="stat-icon">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                        </div>
                        <div className="stat-content">
                            <h3>{sponsors.filter(s => !hasContactInfo(s)).length}</h3>
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
                    <label>Status Filter</label>
                    <div className="status-filter-buttons">
                        {STATUS_FILTERS.map((status) => (
                            <button
                                key={status.key}
                                className={`status-filter-btn ${statusFilter === status.key ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status.key)}
                                style={{ '--status-color': status.color } as React.CSSProperties}
                            >
                                <FontAwesomeIcon icon={status.icon} />
                                <span>{status.label}</span>
                            </button>
                        ))}
                    </div>
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
                                        {sponsor.status === 'pending' ? (
                                            <>
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log('Admin: Approve button clicked for sponsor:', sponsor._id, sponsor.sponsorName, 'Status:', sponsor.status, 'Analysis Status:', sponsor.status);
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

            {/* Consolidation Results */}
            {consolidationResults && (
                <div className="migration-results">
                    <h3>Data Consolidation Results</h3>
                    <div className="migration-stats">
                        <div className="migration-stat">
                            <strong>Total Consolidated:</strong> {consolidationResults.totalConsolidated} sponsors
                        </div>
                        <div className="migration-stat">
                            <strong>Potential Sponsors:</strong> {consolidationResults.potentialSponsors.consolidated} consolidated
                        </div>
                        <div className="migration-stat">
                            <strong>Approved Sponsors:</strong> {consolidationResults.sponsors.consolidated} consolidated
                        </div>
                        <div className="migration-stat">
                            <strong>Errors:</strong> {consolidationResults.potentialSponsors.errors + consolidationResults.sponsors.errors} errors
                        </div>
                    </div>
                    {consolidationResults.details && consolidationResults.details.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <h4>Consolidation Details:</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '12px' }}>
                                {consolidationResults.details.map((detail: any, index: number) => (
                                    <div key={index} style={{ marginBottom: '4px', padding: '4px', background: '#f0fdf4', borderRadius: '4px' }}>
                                        {detail}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => setConsolidationResults(null)}
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