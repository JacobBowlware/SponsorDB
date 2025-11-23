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
    faEyeSlash,
    faChartLine,
    faChartBar,
    faUserPlus,
    faPercent,
    faCalendarAlt,
    faHandshake,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../../config';
import EditSponsorModal from '../../components/EditSponsorModal';
import NewsletterManager from '../../components/NewsletterManager';
import '../../css/pages/authReq/Admin.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string; // Single newsletter for this record
    subscriberCount: number; // Audience size for this newsletter
    dateSponsored?: string | Date; // Date this newsletter placement occurred
    sponsorEmail?: string;
    businessContact?: string;
    contactMethod: 'email' | 'none';
    // Detailed contact info from Gemini
    contactPersonName?: string;
    contactPersonTitle?: string;
    contactType?: 'named_person' | 'business_email' | 'generic_email' | 'not_found';
    confidence?: number;
    dateAdded: string;
    status: 'pending' | 'approved';
    // New structure fields
    newslettersSponsored?: Array<{
        newsletterName: string;
        estimatedAudience: number;
        contentTags: string[];
        dateSponsored: string | Date;
        emailAddress?: string;
    }>;
    contentTags?: string[]; // Tags for this specific newsletter placement
    totalPlacements?: number; // Total number of newsletter placements
    avgAudienceSize?: number; // Average audience size across all newsletters
    mostRecentNewsletterDate?: string | Date; // Most recent newsletter date
    // User tracking
    isViewed?: boolean;
    isApplied?: boolean;
    dateViewed?: string | Date;
    dateApplied?: string | Date;
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
    // Tab state
    const [activeTab, setActiveTab] = useState<'sponsors' | 'analytics' | 'tools' | 'affiliates' | 'newsletters'>('sponsors');
    
    // State management
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Table state
    const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
    const [expandedSponsors, setExpandedSponsors] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [sortBy, setSortBy] = useState('dateSponsored'); // Changed default to dateSponsored
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
    
    // Newsletter data fix migration state
    const [isFixingNewsletterData, setIsFixingNewsletterData] = useState(false);
    const [newsletterFixResults, setNewsletterFixResults] = useState<any>(null);
    
    // Gemini test state
    const [isTestingGemini, setIsTestingGemini] = useState(false);
    const [geminiTestResults, setGeminiTestResults] = useState<any>(null);
    const [isListingGeminiModels, setIsListingGeminiModels] = useState(false);
    const [geminiModelsList, setGeminiModelsList] = useState<any>(null);
    
    // Affiliates state
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [affiliatesLoading, setAffiliatesLoading] = useState(false);
    const [affiliatesPage, setAffiliatesPage] = useState(1);
    const [affiliatesSearchTerm, setAffiliatesSearchTerm] = useState('');
    const [affiliatesStatusFilter, setAffiliatesStatusFilter] = useState('all');
    
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
    
    // User analytics state
    const [userAnalytics, setUserAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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
                sortBy: sortBy === 'dateSponsored' ? 'dateAdded' : sortBy, // Backend uses dateAdded but we sort by dateSponsored
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
            
            // Apply client-side sorting by dateSponsored if needed
            if (sortBy === 'dateSponsored') {
                filteredSponsors.sort((a: Sponsor, b: Sponsor) => {
                    const dateA = new Date(a.dateSponsored || a.dateAdded || 0).getTime();
                    const dateB = new Date(b.dateSponsored || b.dateAdded || 0).getTime();
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                });
            }
            
            setSponsors(filteredSponsors);
        } catch (err: any) {
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
            
            // Refresh data after consolidation
            setTimeout(() => {
                fetchData();
            }, 1000);
        } catch (err: any) {
            setError('Failed to consolidate sponsor data');
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

            alert(`Total sponsors in database: ${response.data.totalCount}\nSample: ${JSON.stringify(response.data.sampleSponsors, null, 2)}`);
        } catch (err: any) {
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
            setTestEmailResult(`Failed to send test email: ${err.response?.data?.error || err.message}`);
        } finally {
            setIsSendingTestEmail(false);
        }
    };

    // Handle newsletter data fix
    const handleListGeminiModels = async () => {
        try {
            setIsListingGeminiModels(true);
            setGeminiModelsList(null);
            setError(null);
            
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/test/gemini/models`, {
                headers: { 'x-auth-token': token }
            });

            setGeminiModelsList(response.data);
        } catch (err: any) {
            setGeminiModelsList({
                success: false,
                message: 'Failed to list Gemini models',
                error: err.response?.data?.error || err.message,
                errorOutput: err.response?.data?.errorOutput || ''
            });
        } finally {
            setIsListingGeminiModels(false);
        }
    };

    const handleTestGemini = async () => {
        try {
            setIsTestingGemini(true);
            setGeminiTestResults(null);
            setError(null);
            
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/test/gemini`, {
                headers: { 'x-auth-token': token }
            });

            setGeminiTestResults(response.data);
        } catch (err: any) {
            setGeminiTestResults({
                success: false,
                message: 'Failed to test Gemini API',
                error: err.response?.data?.error || err.message,
                errorOutput: err.response?.data?.errorOutput || ''
            });
        } finally {
            setIsTestingGemini(false);
        }
    };

    const handleFixNewsletterData = async () => {
        if (!window.confirm('This will migrate missing newsletter data from the old Sponsor collection to SponsorNew. Continue?')) {
            return;
        }

        try {
            setIsFixingNewsletterData(true);
            setNewsletterFixResults(null);
            setError(null);
            
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}migration/fix-newsletter-data`, {}, {
                headers: { 'x-auth-token': token }
            });

            setNewsletterFixResults(response.data.results);
            
            // Refresh the sponsors list
            setTimeout(() => {
                fetchData();
            }, 1000);
        } catch (err: any) {
            setError('Failed to fix newsletter data: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsFixingNewsletterData(false);
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
            
            setSelectedSponsors([]);
            // Small delay to ensure database operations complete before refetching
            setTimeout(() => {
                fetchData();
            }, 100);
        } catch (err: any) {
            setError(`Failed to ${action} sponsors`);
        } finally {
            setIsPerformingBulkAction(false);
        }
    };

    // Handle individual sponsor actions
    const handleSponsorAction = async (sponsorId: string, action: string) => {
        try {
            setIsPerformingIndividualAction(true);
            const token = localStorage.getItem('token');
            
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
                const response = await axios.post(`${config.backendUrl}admin/sponsors/bulk-action`, {
                    action,
                    sponsorIds: [sponsorId]
                }, {
                    headers: { 'x-auth-token': token }
                });
            }
            
            fetchData();
        } catch (err: any) {
            setError(`Failed to ${action} sponsor: ${err.message}`);
        } finally {
            setIsPerformingIndividualAction(false);
        }
    };

    // Handle edit sponsor
    const handleEditSponsor = (sponsor: Sponsor) => {
        setEditingSponsor(sponsor);
    };

    // Handle save sponsor - updates sponsor with collapsed view
    const handleSaveSponsor = async (updatedSponsor: Sponsor) => {
        try {
            const token = localStorage.getItem('token');
            
            // Build payload for collapsed sponsor update
            const payload: any = {
                sponsorName: updatedSponsor.sponsorName,
                sponsorLink: updatedSponsor.sponsorLink,
                rootDomain: updatedSponsor.rootDomain,
                tags: updatedSponsor.tags,
                sponsorEmail: updatedSponsor.sponsorEmail,
                businessContact: updatedSponsor.businessContact,
                contactMethod: updatedSponsor.contactMethod,
                status: updatedSponsor.status
            };
            
            // If newslettersSponsored exists, update it; otherwise use single newsletter fields
            if (updatedSponsor.newslettersSponsored && updatedSponsor.newslettersSponsored.length > 0) {
                payload.newslettersSponsored = updatedSponsor.newslettersSponsored;
            } else {
                // Fallback: update single newsletterSponsored field
                payload.newsletterSponsored = updatedSponsor.newsletterSponsored;
                payload.subscriberCount = updatedSponsor.subscriberCount;
            }
            
            // Send update
            const response = await axios.put(`${config.backendUrl}sponsors/${updatedSponsor._id}`, payload, {
                headers: { 'x-auth-token': token }
            });

            if (response.status === 200) {
                // Refresh data to get updated collapsed records
                fetchData();
                setEditingSponsor(null);
            }
        } catch (err: any) {
            setError('Failed to save sponsor changes: ' + (err.response?.data?.message || err.message));
        }
    };

    // Handle convert sponsor to affiliate
    const handleConvertToAffiliate = async (sponsorId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${config.backendUrl}admin/sponsors/${sponsorId}/convert-to-affiliate`,
                {},
                {
                    headers: { 'x-auth-token': token }
                }
            );
            
            if (response.data.success) {
                // Refresh sponsors list
                fetchData();
                setEditingSponsor(null);
            }
        } catch (err: any) {
            throw new Error(err.response?.data?.message || 'Failed to convert sponsor to affiliate');
        }
    };

    // Fetch affiliates
    const fetchAffiliates = useCallback(async () => {
        try {
            setAffiliatesLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const queryParams = new URLSearchParams({
                page: affiliatesPage.toString(),
                limit: '200',
                sortBy: 'dateAdded',
                sortOrder: 'desc',
                search: affiliatesSearchTerm,
                status: affiliatesStatusFilter === 'all' ? '' : affiliatesStatusFilter
            });

            const response = await axios.get(`${config.backendUrl}admin/affiliates/all?${queryParams}`, {
                headers: { 'x-auth-token': token }
            });

            setAffiliates(response.data.affiliates || []);
        } catch (err: any) {
            setError('Failed to load affiliates');
        } finally {
            setAffiliatesLoading(false);
        }
    }, [affiliatesPage, affiliatesSearchTerm, affiliatesStatusFilter]);

    // Fetch affiliates when tab is active
    useEffect(() => {
        if (activeTab === 'affiliates') {
            fetchAffiliates();
        }
    }, [activeTab, fetchAffiliates]);

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
            // Silently fail subscriber count fetch
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
            setError(error.response?.data?.error || 'Failed to generate newsletter');
        } finally {
            setIsGeneratingNewsletter(false);
        }
    };

    const handleRegenerateNewsletter = async () => {
        await handleGenerateNewsletter();
    };

    const handleSaveNewsletter = async (updatedNewsletter: any) => {
        if (!updatedNewsletter) return;
        
        try {
            setIsSavingNewsletter(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${config.backendUrl}admin/newsletter/update/${updatedNewsletter._id}`,
                {
                    subject: updatedNewsletter.subject,
                    customIntro: updatedNewsletter.customIntro || '',
                    sponsors: updatedNewsletter.sponsors.map((s: any) => s._id || s)
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
            setError(error.response?.data?.error || 'Failed to save newsletter');
        } finally {
            setIsSavingNewsletter(false);
        }
    };

    const handleScheduleNewsletter = async (updatedNewsletter: any, scheduledFor: Date) => {
        if (!updatedNewsletter) return;
        
        try {
            setIsSavingNewsletter(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${config.backendUrl}admin/newsletter/update/${updatedNewsletter._id}`,
                {
                    subject: updatedNewsletter.subject,
                    customIntro: updatedNewsletter.customIntro || '',
                    scheduledFor: scheduledFor.toISOString(),
                    sponsors: updatedNewsletter.sponsors.map((s: any) => s._id || s),
                    status: 'scheduled'
                },
                {
                    headers: { 'x-auth-token': token }
                }
            );
            
            if (response.data.success) {
                setCurrentNewsletter(response.data.newsletter);
                await fetchNewsletters();
                alert(`Newsletter scheduled for ${scheduledFor.toLocaleString()}!`);
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to schedule newsletter');
        } finally {
            setIsSavingNewsletter(false);
        }
    };

    const handleSendTestEmail = async (newsletter: any) => {
        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail') || '';
            
            if (!userEmail) {
                alert('Please set your email in profile settings to send test emails');
                return;
            }

            const response = await axios.post(
                `${config.backendUrl}admin/newsletter/send-test/${newsletter._id}`,
                { testEmail: userEmail },
                {
                    headers: { 'x-auth-token': token }
                }
            );
            
            if (response.data.success) {
                alert(`Test email sent to ${userEmail}!`);
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Failed to send test email');
        }
    };

    const handleSendNewsletter = async (updatedNewsletter: any) => {
        if (!updatedNewsletter) return;
        
        const confirmed = window.confirm(
            `Send this newsletter to all subscribers?\n\nSubject: ${updatedNewsletter.subject}\n\nThis action cannot be undone.`
        );
        
        if (!confirmed) return;

        try {
            setIsSendingNewsletter(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            // Update newsletter first with any changes
            await axios.put(
                `${config.backendUrl}admin/newsletter/update/${updatedNewsletter._id}`,
                {
                    subject: updatedNewsletter.subject,
                    customIntro: updatedNewsletter.customIntro || '',
                    sponsors: updatedNewsletter.sponsors.map((s: any) => s._id || s)
                },
                {
                    headers: { 'x-auth-token': token }
                }
            );
            
            // Then send
            const response = await axios.post(
                `${config.backendUrl}admin/newsletter/send/${updatedNewsletter._id}`,
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
            setCurrentNewsletter(newsletter);
        }
    };

    // Fetch newsletters on component mount
    useEffect(() => {
        fetchNewsletters();
    }, []);

    // Fetch user analytics
    const fetchUserAnalytics = async () => {
        try {
            setLoadingAnalytics(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/user-analytics`, {
                headers: { 'x-auth-token': token }
            });
            if (response.data.success) {
                setUserAnalytics(response.data);
            }
        } catch (error) {
            setError('Failed to load user analytics');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    // Fetch analytics when analytics tab is active
    useEffect(() => {
        if (activeTab === 'analytics' && !userAnalytics) {
            fetchUserAnalytics();
        }
    }, [activeTab]);

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

    // Toggle sponsor row expansion
    const toggleSponsorExpansion = (sponsorId: string) => {
        setExpandedSponsors(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sponsorId)) {
                newSet.delete(sponsorId);
            } else {
                newSet.add(sponsorId);
            }
            return newSet;
        });
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
        const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';
        
        return hasEmail || hasBusinessContact;
    };

    // Get contact info display with detailed formatting
    const getContactDisplay = (sponsor: Sponsor) => {
        // If we have detailed contact info from Gemini (named person)
        if (sponsor.contactPersonName && sponsor.contactPersonTitle && sponsor.sponsorEmail) {
            return (
                <div className="contact-detailed">
                    <div className="contact-person">
                        <div className="contact-name">{sponsor.contactPersonName}</div>
                        <div className="contact-title">{sponsor.contactPersonTitle}</div>
                    </div>
                    <div className="contact-email">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}</a>
                    </div>
                    {sponsor.contactType === 'named_person' && (
                        <span className="contact-badge contact-badge-high">High Value Contact</span>
                    )}
                </div>
            );
        }
        
        // If we have business email type
        if (sponsor.contactType === 'business_email' && sponsor.sponsorEmail) {
            return (
                <div className="contact-detailed">
                    <div className="contact-email">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}</a>
                    </div>
                    <span className="contact-badge contact-badge-medium">Business Email</span>
                </div>
            );
        }
        
        // If we have generic email
        if (sponsor.contactType === 'generic_email' && sponsor.sponsorEmail) {
            return (
                <div className="contact-detailed">
                    <div className="contact-email">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}</a>
                    </div>
                    <span className="contact-badge contact-badge-low">Generic Email</span>
                </div>
            );
        }
        
        // Fallback to simple email display
        const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim();
        const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim();
        
        if (hasEmail && hasBusinessContact) {
            return (
                <div className="contact-both">
                    <div className="contact-item">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}</a>
                    </div>
                    <div className="contact-item">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <a href={`mailto:${sponsor.businessContact}`}>{sponsor.businessContact}</a>
                    </div>
                </div>
            );
        } else if (hasEmail) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}</a>
                </div>
            );
        } else if (hasBusinessContact) {
            return (
                <div className="contact-item">
                    <FontAwesomeIcon icon={faEnvelope} />
                    <a href={`mailto:${sponsor.businessContact}`}>{sponsor.businessContact}</a>
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
                        <h1>Admin Dashboard</h1>
                        <p className="admin-subtitle">Manage sponsors, view analytics, and monitor system activity</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="admin-tabs">
                    <button 
                        className={`admin-tab ${activeTab === 'sponsors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sponsors')}
                    >
                        <FontAwesomeIcon icon={faDatabase} />
                        Sponsors
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <FontAwesomeIcon icon={faChartLine} />
                        Analytics
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'tools' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tools')}
                    >
                        <FontAwesomeIcon icon={faRobot} />
                        Tools
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'affiliates' ? 'active' : ''}`}
                        onClick={() => setActiveTab('affiliates')}
                    >
                        <FontAwesomeIcon icon={faHandshake} />
                        Affiliates
                    </button>
                    <button 
                        className={`admin-tab ${activeTab === 'newsletters' ? 'active' : ''}`}
                        onClick={() => setActiveTab('newsletters')}
                    >
                        <FontAwesomeIcon icon={faNewspaper} />
                        Newsletters
                    </button>
                </div>

                {/* Sponsors Tab */}
                {activeTab === 'sponsors' && (
                    <div className="admin-tab-content">
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

                        {/* Stats Cards */}
                        {stats && (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <div className="stat-content">
                                        <h3>{stats.totalSponsors?.toLocaleString() || '0'}</h3>
                                        <p>Total Sponsor Companies</p>
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
                                            #
                                        </th>
                                        <th style={{ width: '50px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedSponsors.length === sponsors.length && sponsors.length > 0}
                                                onChange={handleSelectAll}
                                                style={{ transform: 'scale(1.2)' }}
                                            />
                                        </th>
                                        <th style={{ width: '30px' }}></th>
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
                                        <th>Contact Info</th>
                                        <th>Status</th>
                                        <th 
                                            className="sortable"
                                            onClick={() => handleSort('dateSponsored')}
                                        >
                                            Last Active
                                            <FontAwesomeIcon 
                                                icon={sortBy === 'dateSponsored' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                                className={`sort-icon ${sortBy === 'dateSponsored' ? 'active' : ''}`}
                                            />
                                        </th>
                                        <th>Placements</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sponsors.map((sponsor, index) => {
                                        const statusBadge = getStatusBadge(sponsor);
                                        const displayDate = sponsor.dateSponsored || sponsor.dateAdded;
                                        // Count: latest added = highest number, earliest = 1
                                        const countNumber = sponsors.length - index;
                                        const isExpanded = expandedSponsors.has(sponsor._id);
                                        const newsletters = sponsor.newslettersSponsored || [];
                                        
                                        return (
                                            <React.Fragment key={sponsor._id}>
                                                <tr 
                                                    onDoubleClick={() => handleEditSponsor(sponsor)}
                                                    className={`sponsor-row ${isExpanded ? 'expanded' : ''}`}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td className="count-number">
                                                        {countNumber}
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSponsors.includes(sponsor._id)}
                                                            onChange={() => handleSelectSponsor(sponsor._id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ transform: 'scale(1.2)' }}
                                                        />
                                                    </td>
                                                    <td className="expand-cell">
                                                        {newsletters.length > 0 && (
                                                            <button
                                                                className="expand-toggle"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSponsorExpansion(sponsor._id);
                                                                }}
                                                                title={isExpanded ? 'Collapse' : `Expand to see ${newsletters.length} newsletter${newsletters.length !== 1 ? 's' : ''}`}
                                                            >
                                                                <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="sponsor-name">
                                                        <div 
                                                            className="sponsor-name-link"
                                                            onClick={() => window.open(`https://${sponsor.rootDomain}`, '_blank')}
                                                        >
                                                            {sponsor.sponsorName}
                                                            <FontAwesomeIcon icon={faExternalLink} />
                                                        </div>
                                                        {sponsor.totalPlacements && sponsor.totalPlacements > 1 && (
                                                            <span className="placement-count-badge">
                                                                {sponsor.totalPlacements} placements
                                                            </span>
                                                        )}
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
                                                    <td className="date">
                                                        {formatDate(typeof displayDate === 'string' ? displayDate : displayDate.toString())}
                                                    </td>
                                                    <td className="placements-count">
                                                        {sponsor.totalPlacements ? (
                                                            <span className="placements-badge">
                                                                {sponsor.totalPlacements} newsletter{sponsor.totalPlacements !== 1 ? 's' : ''}
                                                            </span>
                                                        ) : (
                                                            <span className="no-placements">No placements</span>
                                                        )}
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
                                                {isExpanded && newsletters.length > 0 && (
                                                    <tr className="sponsor-details-row">
                                                        <td colSpan={11}>
                                                            <div className="sponsor-expanded-details">
                                                                <div className="expanded-details-header">
                                                                    <h4>All Newsletter Placements ({newsletters.length})</h4>
                                                                </div>
                                                                <div className="newsletters-list">
                                                                    {newsletters.map((newsletter, idx) => (
                                                                        <div key={idx} className="newsletter-item">
                                                                            <div className="newsletter-name">
                                                                                <strong>{newsletter.newsletterName || 'Unnamed Newsletter'}</strong>
                                                                            </div>
                                                                            <div className="newsletter-meta">
                                                                                <span className="newsletter-audience">
                                                                                    {newsletter.estimatedAudience ? newsletter.estimatedAudience.toLocaleString() : 'N/A'} readers
                                                                                </span>
                                                                                <span className="newsletter-date">
                                                                                    {formatDate(newsletter.dateSponsored ? (typeof newsletter.dateSponsored === 'string' ? newsletter.dateSponsored : newsletter.dateSponsored.toString()) : sponsor.dateAdded)}
                                                                                </span>
                                                                                {newsletter.contentTags && newsletter.contentTags.length > 0 && (
                                                                                    <div className="newsletter-tags">
                                                                                        {newsletter.contentTags.map((tag, tagIdx) => (
                                                                                            <span key={tagIdx} className="content-tag">{tag}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {sponsor.tags && sponsor.tags.length > 0 && (
                                                                    <div className="sponsor-tags-section">
                                                                        <strong>Market Tags: </strong>
                                                                        {sponsor.tags.map((tag, tagIdx) => (
                                                                            <span key={tagIdx} className="market-tag">{tag}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="admin-tab-content">
                        {loadingAnalytics ? (
                            <div className="admin-loading">
                                <div className="admin-loading__spinner"></div>
                                <p>Loading Analytics...</p>
                            </div>
                        ) : userAnalytics ? (
                            <>
                                <div className="analytics-header">
                                    <h2>User Analytics</h2>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={fetchUserAnalytics}
                                        disabled={loadingAnalytics}
                                    >
                                        <FontAwesomeIcon icon={faRefresh} spin={loadingAnalytics} />
                                        Refresh
                                    </button>
                                </div>

                                {/* Key Metrics */}
                                <div className="analytics-stats-grid">
                                    <div className="analytics-stat-card">
                                        <div className="analytics-stat-icon">
                                            <FontAwesomeIcon icon={faUsers} />
                                        </div>
                                        <div className="analytics-stat-content">
                                            <h3>{userAnalytics.totalUsers?.toLocaleString() || '0'}</h3>
                                            <p>Total Users</p>
                                        </div>
                                    </div>
                                    
                                    <div className="analytics-stat-card analytics-stat-card--info">
                                        <div className="analytics-stat-icon">
                                            <FontAwesomeIcon icon={faUserPlus} />
                                        </div>
                                        <div className="analytics-stat-content">
                                            <h3>{userAnalytics.usersToday || '0'}</h3>
                                            <p>Users Today</p>
                                        </div>
                                    </div>
                                    
                                    <div className="analytics-stat-card analytics-stat-card--success">
                                        <div className="analytics-stat-icon">
                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                        </div>
                                        <div className="analytics-stat-content">
                                            <h3>{userAnalytics.signupsThisMonth || '0'}</h3>
                                            <p>Signups This Month</p>
                                        </div>
                                    </div>
                                    
                                    <div className="analytics-stat-card analytics-stat-card--primary">
                                        <div className="analytics-stat-icon">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                        </div>
                                        <div className="analytics-stat-content">
                                            <h3>{userAnalytics.paidUsers || userAnalytics.activeSubscribers || '0'}</h3>
                                            <p>Paid Users</p>
                                        </div>
                                    </div>
                                    
                                    <div className="analytics-stat-card analytics-stat-card--success">
                                        <div className="analytics-stat-icon">
                                            <FontAwesomeIcon icon={faNewspaper} />
                                        </div>
                                        <div className="analytics-stat-content">
                                            <h3>{userAnalytics.newsletterSubscribers || '0'}</h3>
                                            <p>Newsletter Subscribers</p>
                                        </div>
                                    </div>
                                    
                                    <div className="analytics-stat-card analytics-stat-card--warning">
                                        <div className="analytics-stat-icon">
                                            <FontAwesomeIcon icon={faPercent} />
                                        </div>
                                        <div className="analytics-stat-content">
                                            <h3>{userAnalytics.conversionRate || '0'}%</h3>
                                            <p>Conversion Rate</p>
                                            <small>Signups to Paid</small>
                                        </div>
                                    </div>
                                    
                                    <div className="analytics-stat-card">
                                        <div className="analytics-stat-icon">
                                            <FontAwesomeIcon icon={faUsers} />
                                        </div>
                                        <div className="analytics-stat-content">
                                            <h3>{userAnalytics.usersWithoutSubscription || '0'}</h3>
                                            <p>No Subscription</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Monthly Signups Chart */}
                                {userAnalytics.monthlySignups && userAnalytics.monthlySignups.length > 0 && (
                                    <div className="analytics-chart-section">
                                        <h3>Monthly User Signups</h3>
                                        <div className="analytics-chart">
                                            {userAnalytics.monthlySignups.map((month: any, index: number) => {
                                                const maxCount = Math.max(...userAnalytics.monthlySignups.map((m: any) => m.count), 1);
                                                const heightPercent = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                                                
                                                return (
                                                    <div key={index} className="analytics-chart-bar">
                                                        <div 
                                                            className="analytics-chart-bar-fill" 
                                                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                                        ></div>
                                                        <div className="analytics-chart-bar-label">{month.month}</div>
                                                        <div className="analytics-chart-bar-value">{month.count}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Conversion Breakdown */}
                                <div className="analytics-conversion-section">
                                    <h3>Conversion Breakdown</h3>
                                    <div className="conversion-breakdown">
                                        <div className="conversion-item">
                                            <span className="conversion-label">Total Users:</span>
                                            <span className="conversion-value">{userAnalytics.totalUsers || 0}</span>
                                        </div>
                                        <div className="conversion-item conversion-item--success">
                                            <span className="conversion-label">With Subscription:</span>
                                            <span className="conversion-value">{userAnalytics.activeSubscribers || 0}</span>
                                        </div>
                                        <div className="conversion-item conversion-item--warning">
                                            <span className="conversion-label">Without Subscription:</span>
                                            <span className="conversion-value">{userAnalytics.usersWithoutSubscription || 0}</span>
                                        </div>
                                        <div className="conversion-item conversion-item--primary">
                                            <span className="conversion-label">Conversion Rate:</span>
                                            <span className="conversion-value">{userAnalytics.conversionRate || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="analytics-empty">
                                <FontAwesomeIcon icon={faChartLine} />
                                <p>No analytics data available</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Affiliates Tab */}
                {activeTab === 'affiliates' && (
                    <div className="admin-tab-content">
                        <div className="admin-actions">
                            <input
                                type="text"
                                placeholder="Search affiliates..."
                                value={affiliatesSearchTerm}
                                onChange={(e) => setAffiliatesSearchTerm(e.target.value)}
                                className="search-input"
                                style={{ marginRight: '10px', padding: '8px', width: '300px' }}
                            />
                            <select
                                value={affiliatesStatusFilter}
                                onChange={(e) => setAffiliatesStatusFilter(e.target.value)}
                                className="status-filter"
                                style={{ marginRight: '10px', padding: '8px' }}
                            >
                                <option value="all">All Status</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                            </select>
                            <button 
                                className="btn btn-secondary"
                                onClick={fetchAffiliates}
                                disabled={affiliatesLoading}
                            >
                                <FontAwesomeIcon icon={faRefresh} spin={affiliatesLoading} />
                                Refresh
                            </button>
                        </div>

                        {affiliatesLoading ? (
                            <div className="admin-loading">
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <p>Loading affiliates...</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="sponsor-table">
                                    <thead>
                                        <tr>
                                            <th>Affiliate Name</th>
                                            <th>Domain</th>
                                            <th>Affiliate Link</th>
                                            <th>Newsletters</th>
                                            <th>Status</th>
                                            <th>Date Added</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {affiliates.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                                                    No affiliates found
                                                </td>
                                            </tr>
                                        ) : (
                                            affiliates.map((affiliate) => (
                                                <tr key={affiliate._id}>
                                                    <td className="sponsor-name">{affiliate.affiliateName}</td>
                                                    <td className="domain">{affiliate.rootDomain}</td>
                                                    <td className="source">
                                                        <a href={affiliate.affiliateLink} target="_blank" rel="noopener noreferrer">
                                                            {affiliate.affiliateLink}
                                                            <FontAwesomeIcon icon={faExternalLink} style={{ marginLeft: '5px' }} />
                                                        </a>
                                                    </td>
                                                    <td className="audience">
                                                        {affiliate.affiliatedNewsletters?.length || 0} newsletter{affiliate.affiliatedNewsletters?.length !== 1 ? 's' : ''}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${affiliate.status === 'approved' ? 'approved' : 'pending'}`}>
                                                            {affiliate.status || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td className="date">{formatDate(affiliate.dateAdded)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Newsletters Tab */}
                {activeTab === 'newsletters' && (
                    <div className="admin-tab-content">
                        <NewsletterManager />
                    </div>
                )}

                {/* Tools Tab */}
                {activeTab === 'tools' && (
                    <div className="admin-tab-content">
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

                        {/* Gemini API Test */}
                        <div className="admin-tool-card" style={{ marginBottom: '24px', padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#1e293b', fontSize: '1.25rem', fontWeight: 600 }}>
                                <FontAwesomeIcon icon={faRobot} style={{ marginRight: '8px', color: '#10b981' }} />
                                Gemini API Tools
                            </h3>
                            <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                                Test your Gemini API connection and list available models
                            </p>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <button 
                                    className="btn btn-info"
                                    onClick={handleListGeminiModels}
                                    disabled={isListingGeminiModels}
                                >
                                    <FontAwesomeIcon icon={isListingGeminiModels ? faSpinner : faList} spin={isListingGeminiModels} />
                                    {isListingGeminiModels ? ' Listing Models...' : ' List Available Models'}
                                </button>
                                <button 
                                    className="btn btn-success"
                                    onClick={handleTestGemini}
                                    disabled={isTestingGemini}
                                >
                                    <FontAwesomeIcon icon={isTestingGemini ? faSpinner : faRobot} spin={isTestingGemini} />
                                    {isTestingGemini ? ' Testing Gemini...' : ' Test Gemini API'}
                                </button>
                            </div>
                            {geminiModelsList && (
                                <div className="migration-results" style={{ marginTop: '16px', padding: '16px', background: geminiModelsList.success ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${geminiModelsList.success ? '#86efac' : '#fecaca'}` }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '12px', color: geminiModelsList.success ? '#166534' : '#991b1b', fontSize: '1rem', fontWeight: 600 }}>
                                        {geminiModelsList.success ? '✅ Available Gemini Models' : '❌ Failed to List Models'}
                                    </h4>
                                    {geminiModelsList.output && (
                                        <div style={{ marginBottom: '12px', padding: '8px', background: 'white', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto' }}>
                                            {geminiModelsList.output}
                                        </div>
                                    )}
                                    {geminiModelsList.errorOutput && (
                                        <div style={{ marginBottom: '12px', padding: '8px', background: '#fee2e2', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#991b1b', whiteSpace: 'pre-wrap' }}>
                                            <strong>Error:</strong>
                                            <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{geminiModelsList.errorOutput}</pre>
                                        </div>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setGeminiModelsList(null)}
                                        style={{ marginTop: '12px' }}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                            {geminiTestResults && (
                                <div className="migration-results" style={{ marginTop: '16px', padding: '16px', background: geminiTestResults.success ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${geminiTestResults.success ? '#86efac' : '#fecaca'}` }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '12px', color: geminiTestResults.success ? '#166534' : '#991b1b', fontSize: '1rem', fontWeight: 600 }}>
                                        {geminiTestResults.success ? '✅ Test Successful!' : '❌ Test Failed'}
                                    </h4>
                                    <div style={{ marginBottom: '12px' }}>
                                        <strong>Message:</strong> {geminiTestResults.message}
                                    </div>
                                    {geminiTestResults.output && (
                                        <div style={{ marginBottom: '12px', padding: '8px', background: 'white', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                            <strong>Output:</strong>
                                            <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{geminiTestResults.output}</pre>
                                        </div>
                                    )}
                                    {geminiTestResults.errorOutput && (
                                        <div style={{ marginBottom: '12px', padding: '8px', background: '#fee2e2', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#991b1b' }}>
                                            <strong>Error:</strong>
                                            <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>{geminiTestResults.errorOutput}</pre>
                                        </div>
                                    )}
                                    {geminiTestResults.error && (
                                        <div style={{ marginBottom: '12px', padding: '8px', background: '#fee2e2', borderRadius: '4px', fontSize: '0.85rem', color: '#991b1b' }}>
                                            <strong>Error:</strong> {geminiTestResults.error}
                                        </div>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setGeminiTestResults(null)}
                                        style={{ marginTop: '12px' }}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Database Migration Tools */}
                        <div className="admin-tool-card" style={{ marginBottom: '24px', padding: '24px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#1e293b', fontSize: '1.25rem', fontWeight: 600 }}>
                                <FontAwesomeIcon icon={faDatabase} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                Database Migration Tools
                            </h3>
                            <p style={{ marginBottom: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                                Fix missing newsletter data by migrating from the old Sponsor collection to SponsorNew
                            </p>
                            <button 
                                className="btn btn-warning"
                                onClick={handleFixNewsletterData}
                                disabled={isFixingNewsletterData}
                                style={{ marginBottom: '16px' }}
                            >
                                <FontAwesomeIcon icon={isFixingNewsletterData ? faSpinner : faDatabase} spin={isFixingNewsletterData} />
                                {isFixingNewsletterData ? ' Fixing Newsletter Data...' : ' Fix Newsletter Data'}
                            </button>
                            {newsletterFixResults && (
                                <div className="migration-results" style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#1e293b', fontSize: '1rem', fontWeight: 600 }}>Migration Results:</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <strong>Total Old Sponsors:</strong> {newsletterFixResults.totalOldSponsors}
                                        </div>
                                        <div>
                                            <strong>Sponsors Processed:</strong> {newsletterFixResults.sponsorsProcessed}
                                        </div>
                                        <div>
                                            <strong>Newsletters Added:</strong> {newsletterFixResults.newslettersAdded}
                                        </div>
                                        <div>
                                            <strong>New Sponsors Created:</strong> {newsletterFixResults.sponsorsCreated || 0}
                                        </div>
                                        <div>
                                            <strong>Duplicates Skipped:</strong> {newsletterFixResults.duplicatesSkipped || 0}
                                        </div>
                                    </div>
                                    {newsletterFixResults.errors && newsletterFixResults.errors.length > 0 && (
                                        <div style={{ marginTop: '12px' }}>
                                            <h5 style={{ marginBottom: '8px', color: '#ef4444', fontSize: '0.9rem' }}>Errors ({newsletterFixResults.errors.length}):</h5>
                                            <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem' }}>
                                                {newsletterFixResults.errors.slice(0, 10).map((err: any, idx: number) => (
                                                    <div key={idx} style={{ marginBottom: '4px', padding: '4px', background: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
                                                        {err.sponsor} ({err.rootDomain}): {err.error}
                                                    </div>
                                                ))}
                                                {newsletterFixResults.errors.length > 10 && (
                                                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                                                        ... and {newsletterFixResults.errors.length - 10} more errors
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setNewsletterFixResults(null)}
                                        style={{ marginTop: '12px' }}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                    onConvertToAffiliate={handleConvertToAffiliate}
                />
            )}
            </div>
        </div>
    );
};

export default Admin;
