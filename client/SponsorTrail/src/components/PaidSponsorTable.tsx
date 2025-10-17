import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink, faSpinner, faExclamationTriangle, faSort, faSortUp, faSortDown, faEdit, faEnvelope, faArrowRight, faHandshake } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import AffiliateProgramsTable from './AffiliateProgramsTable';
import '../css/PaidSponsorTable.css';
import '../css/components/AffiliateProgramsTable.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    sponsorEmail?: string;
    sponsorApplication?: string;
    contactMethod?: 'email' | 'application' | 'both' | 'none';
    analysisStatus?: 'complete' | 'manual_review_required' | 'pending';
    dateAdded: string;
    isViewed?: boolean;
    isApplied?: boolean;
    dateViewed?: string;
    dateApplied?: string;
    // Affiliate program fields
    isAffiliateProgram?: boolean;
    affiliateSignupLink?: string;
    commissionInfo?: string;
    interestedUsers?: string[];
    __v?: number;
}

interface SponsorUpdate {
    sponsorName: string;
    sponsorLink: string;
    rootDomain?: string;
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    tags: string[];
}

interface PaidSponsorTableProps {
    onError?: (error: string) => void;
    activeFilter: string;
    isAdmin?: boolean;
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    showAffiliatePrograms?: boolean;
    user?: {
        email: string;
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

// Sample sponsors for testing
const SAMPLE_SPONSORS: Sponsor[] = [
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
        isViewed: false,
        isApplied: false
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
        isApplied: true
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
        isApplied: false
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
        isApplied: false
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
        isViewed: false,
        isApplied: false
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
        isApplied: true
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
        isApplied: false
    },
    {
        _id: '8',
        sponsorName: 'Spotify',
        sponsorLink: 'https://spotify.com',
        rootDomain: 'spotify.com',
        tags: ['Entertainment', 'Music', 'Technology'],
        newsletterSponsored: 'Morning Brew',
        subscriberCount: 2500000,
        businessContact: 'business@spotify.com',
        dateAdded: '2024-03-01',
        isViewed: true,
        isApplied: false
    },
    {
        _id: '9',
        sponsorName: 'Amazon Associates',
        sponsorLink: 'https://affiliate-program.amazon.com',
        rootDomain: 'amazon.com',
        tags: ['Affiliate', 'Ecommerce', 'Retail'],
        newsletterSponsored: 'The Hustle',
        subscriberCount: 1000000,
        businessContact: 'https://affiliate-program.amazon.com/join',
        isAffiliateProgram: true,
        affiliateSignupLink: 'https://affiliate-program.amazon.com/join',
        commissionInfo: 'Up to 10% commission on qualifying purchases',
        dateAdded: '2024-03-20',
        isViewed: false,
        isApplied: false
    },
    {
        _id: '10',
        sponsorName: 'Shopify Partners',
        sponsorLink: 'https://partners.shopify.com',
        rootDomain: 'shopify.com',
        tags: ['Affiliate', 'Ecommerce', 'Technology'],
        newsletterSponsored: 'Morning Brew',
        subscriberCount: 800000,
        businessContact: 'https://partners.shopify.com/affiliates',
        isAffiliateProgram: true,
        affiliateSignupLink: 'https://partners.shopify.com/affiliates',
        commissionInfo: 'Earn up to $2,000 per referral',
        dateAdded: '2024-03-25',
        isViewed: false,
        isApplied: false
    }
];

const PaidSponsorTable: React.FC<PaidSponsorTableProps> = ({ onError, activeFilter, isAdmin, searchQuery, sortBy = 'dateAdded', sortOrder = 'desc', showAffiliatePrograms = false, user }) => {
    const navigate = useNavigate();
    const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
    const [displayedSponsors, setDisplayedSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 50;
    
    // Simple mobile detection - no resize listener
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Sponsor>>({});

    // Fetch all sponsors initially
    const fetchAllSponsors = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Check if we're in local development
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocalDev) {
                // Use sample sponsors for development
                setAllSponsors(SAMPLE_SPONSORS);
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
                },
                params: {
                    affiliateOnly: showAffiliatePrograms.toString()
                }
            });
            console.log('Client: Fetched sponsors from server:', response.data);
            console.log('Client: Number of sponsors:', response.data.length);
            if (response.data.length > 0) {
                console.log('Client: First sponsor ID:', response.data[0]._id);
                console.log('Client: First sponsor name:', response.data[0].sponsorName);
            }
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
    }, [onError]); // Removed navigate from dependencies

    useEffect(() => {
        fetchAllSponsors();
    }, [showAffiliatePrograms]); // Refetch when affiliate toggle changes

    const filteredSponsors = useMemo(() => {
        let filtered = allSponsors;
        
        // Filter out sponsors without contact info (only show sponsors with email or application)
        filtered = filtered.filter(sponsor => {
            // Check new contact fields first
            const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
            const hasApplication = sponsor.sponsorApplication && sponsor.sponsorApplication.trim() !== '';
            
            // Also check the legacy businessContact field
            const hasBusinessContact = sponsor.businessContact && sponsor.businessContact.trim() !== '';
            
            // Only show sponsors that have at least one contact method
            return hasEmail || hasApplication || hasBusinessContact;
        });
        
        // Apply affiliate filter if showAffiliatePrograms is true
        if (showAffiliatePrograms) {
            console.log('🔍 Filtering for affiliate programs...');
            console.log('Total sponsors before affiliate filter:', filtered.length);
            
            const affiliateSponsors = filtered.filter(sponsor => {
                const isAffiliate = sponsor.isAffiliateProgram === true || 
                                   (sponsor.tags && sponsor.tags.includes('Affiliate'));
                
                if (isAffiliate) {
                    console.log('✅ Found affiliate sponsor:', sponsor.sponsorName, {
                        isAffiliateProgram: sponsor.isAffiliateProgram,
                        tags: sponsor.tags
                    });
                }
                
                return isAffiliate;
            });
            
            console.log('Affiliate sponsors found:', affiliateSponsors.length);
            filtered = affiliateSponsors;
        }
        
        // Apply category filter - only filter if there are active filters
        if (activeFilter && activeFilter.trim() !== '') {
            const filterTags = activeFilter.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '');
            if (filterTags.length > 0) {
                filtered = filtered.filter(sponsor => 
                    sponsor.tags?.some(tag => 
                        filterTags.some(filterTag => tag.toLowerCase() === filterTag)
                    )
                );
            }
        }
        
        // Apply search filter if searchQuery exists
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(sponsor => 
                sponsor.sponsorName.toLowerCase().includes(query) ||
                sponsor.newsletterSponsored.toLowerCase().includes(query) ||
                sponsor.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }
        
        return filtered;
    }, [allSponsors, activeFilter, searchQuery, showAffiliatePrograms]);

    const sortedSponsors = [...filteredSponsors].sort((a, b) => {
        if (sortBy === 'subscriberCount') {
            return sortOrder === 'asc' ? a.subscriberCount - b.subscriberCount : b.subscriberCount - a.subscriberCount;
        } else if (sortBy === 'dateAdded') {
            return sortOrder === 'asc' ? new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime() : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        } else if (sortBy === 'sponsorName') {
            return sortOrder === 'asc' ? a.sponsorName.localeCompare(b.sponsorName) : b.sponsorName.localeCompare(a.sponsorName);
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



    const handleEdit = (sponsor: Sponsor) => {
        setEditingSponsor(sponsor);
        setEditFormData(sponsor);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSponsor) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const updateData: SponsorUpdate = {
                sponsorName: editFormData.sponsorName || '',
                sponsorLink: editFormData.sponsorLink || '',
                rootDomain: editFormData.rootDomain || '',
                newsletterSponsored: editFormData.newsletterSponsored || '',
                subscriberCount: editFormData.subscriberCount || 0,
                businessContact: editFormData.businessContact || '',
                tags: editFormData.tags || []
            };

            const response = await axios.put(
                `${config.backendUrl}sponsors/${editingSponsor._id}`,
                updateData,
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            // Update the sponsor in the local state
            setAllSponsors(prevSponsors => 
                prevSponsors.map(sponsor => 
                    sponsor._id === editingSponsor._id ? response.data : sponsor
                )
            );

            setEditingSponsor(null);
            setEditFormData({});
        } catch (err) {
            let errorMessage = 'Something went wrong while updating the sponsor.';
            if (axios.isAxiosError(err)) {
                errorMessage = err.response?.data || errorMessage;
            }
            setError(errorMessage);
            if (onError) onError(errorMessage);
        }
    };

    const handleEditCancel = () => {
        setEditingSponsor(null);
        setEditFormData({});
    };

    const markAsViewed = async (sponsorId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.post(
                `${config.backendUrl}sponsors/${sponsorId}/view`,
                {},
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            // Update the sponsor in the local state using the server response
            const updatedSponsor = response.data;
            setAllSponsors(prevSponsors => 
                prevSponsors.map(sponsor => 
                    sponsor._id === sponsorId ? { 
                        ...sponsor, 
                        isViewed: updatedSponsor.isViewed,
                        dateViewed: updatedSponsor.dateViewed
                    } : sponsor
                )
            );
        } catch (err) {
            console.error('Error marking sponsor as viewed:', err);
        }
    };

    const markAsApplied = async (sponsorId: string) => {
        try {
            console.log('Client: Attempting to mark sponsor as applied, ID:', sponsorId);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.post(
                `${config.backendUrl}sponsors/${sponsorId}/apply`,
                {},
                {
                    headers: {
                        'x-auth-token': token
                    }
                }
            );

            console.log('Client: Server response:', response.data);

            // Update the sponsor in the local state using the server response
            const updatedSponsor = response.data;
            setAllSponsors(prevSponsors => 
                prevSponsors.map(sponsor => 
                    sponsor._id === sponsorId ? { 
                        ...sponsor, 
                        isApplied: updatedSponsor.isApplied, 
                        isViewed: updatedSponsor.isViewed,
                        dateApplied: updatedSponsor.dateApplied,
                        dateViewed: updatedSponsor.dateViewed
                    } : sponsor
                )
            );
        } catch (err) {
            console.error('Client: Error marking sponsor as applied:', err);
            if (axios.isAxiosError(err)) {
                console.error('Client: Response data:', err.response?.data);
                console.error('Client: Response status:', err.response?.status);
            }
        }
    };

    const handleSponsorClick = (sponsor: Sponsor) => {
        if (!sponsor.isViewed) {
            markAsViewed(sponsor._id);
        }
        // Open sponsor website
        window.open(`https://${sponsor.rootDomain}`, '_blank');
    };

    const handleContactClick = (sponsor: Sponsor) => {
        if (!sponsor.isApplied) {
            markAsApplied(sponsor._id);
        }
        if (!sponsor.isViewed) {
            markAsViewed(sponsor._id);
        }
        
        // Open the application link if it exists
        if (sponsor.sponsorApplication) {
            window.open(sponsor.sponsorApplication, '_blank');
        } else if (sponsor.businessContact && !sponsor.businessContact.includes('@')) {
            // Fallback to businessContact if it's not an email
            window.open(sponsor.businessContact, '_blank');
        }
    };

    const generateEmailTemplate = (sponsor: Sponsor) => {
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
        
        const subject = `Partnership Opportunity: ${newsletterName}`;
        
        // Shortened, more direct body
        const body = `Hi there,

I'm reaching out from ${newsletterName}, a ${publishingFreq} newsletter focused on ${newsletterTopic}.

I noticed ${sponsor.sponsorName} sponsors newsletters in this space, and I think our audience would be a great fit.

Quick stats:
- ${audienceDescription}
- ${publishingFreq.charAt(0).toUpperCase() + publishingFreq.slice(1)} publication focused on ${newsletterTopic}${demographicInfo}

Are you open to discussing a sponsorship? Happy to share our media kit and rates.

Best,
[Your Name]
${newsletterName}`;

        return {
            subject: encodeURIComponent(subject),
            body: encodeURIComponent(body)
        };
    };

    const handleEmailClick = (sponsor: Sponsor) => {
        // Check for email in new fields first, then fallback to legacy field
        const email = sponsor.sponsorEmail || (sponsor.businessContact && sponsor.businessContact.includes('@') ? sponsor.businessContact : null);
        
        if (!email) {
            return;
        }

        const template = generateEmailTemplate(sponsor);
        const mailtoLink = `mailto:${email}?subject=${template.subject}&body=${template.body}`;
        
        // Mark as applied and viewed
        handleContactClick(sponsor);
        
        // Open email client
        window.location.href = mailtoLink;
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

    // Mobile view - Sponsor cards
    if (isMobile) {
        console.log('Mobile view active, displayedSponsors:', displayedSponsors);
        return (
            <div className="mobile-sponsors-grid">
                {displayedSponsors.length > 0 ? (
                    displayedSponsors.map((sponsor) => (
                        <div key={sponsor._id} className="sponsor-card">
                            <div className="sponsor-card-header">
                                <div>
                                    <h3 className="sponsor-name">{sponsor.sponsorName}</h3>
                                    <p className="sponsor-domain">{sponsor.rootDomain}</p>
                                </div>
                            </div>
                            
                            <div className="sponsor-tags">
                                {sponsor.tags?.map((tag, index) => (
                                    <span key={index} className="sponsor-tag">{tag}</span>
                                ))}
                            </div>
                            
                            <div className="sponsor-details">
                                <div className="sponsor-detail">
                                    <span className="sponsor-detail-label">Newsletter</span>
                                    <span className="sponsor-detail-value">{sponsor.newsletterSponsored}</span>
                                </div>
                                <div className="sponsor-detail">
                                    <span className="sponsor-detail-label">Audience</span>
                                    <span className="sponsor-detail-value">{sponsor.subscriberCount.toLocaleString()}</span>
                                </div>
                                <div className="sponsor-detail">
                                    <span className="sponsor-detail-label">Contact</span>
                                    <span className="sponsor-detail-value">{sponsor.businessContact}</span>
                                </div>
                                <div className="sponsor-detail">
                                    <span className="sponsor-detail-label">Added</span>
                                    <span className="sponsor-detail-value">{new Date(sponsor.dateAdded).toLocaleDateString()}</span>
                                </div>
                            </div>
                            
                            <div className="sponsor-actions">
                                <button 
                                    className="sponsor-action-btn sponsor-view-btn"
                                    onClick={() => handleSponsorClick(sponsor)}
                                >
                                    <FontAwesomeIcon icon={faExternalLink} />
                                    View
                                </button>
                                <button 
                                    className="sponsor-action-btn sponsor-apply-btn"
                                    onClick={() => handleContactClick(sponsor)}
                                >
                                    <FontAwesomeIcon icon={faHandshake} />
                                    {sponsor.isApplied ? 'Applied' : 'Apply'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mobile-no-results">
                        <p>No sponsors found. Try adjusting your filters or search terms.</p>
                        <p>Debug: displayedSponsors length: {displayedSponsors.length}</p>
                        <p>Debug: isMobile: {isMobile.toString()}</p>
                    </div>
                )}
            </div>
        );
    }

    // Show affiliate programs table if toggle is on
    if (showAffiliatePrograms) {
        return (
            <AffiliateProgramsTable 
                onError={onError || (() => {})} 
                user={user}
            />
        );
    }

    // Desktop view - Optimized Table
    return (
        <>
        <div className="sponsor-table-container">
            <div className="sponsor-table-optimized">
                <table className="sponsor-table-full">
                    <thead>
                        <tr>
                            <th className="sponsor-table__column-header sponsor-name-col">
                                Sponsor Name
                                <FontAwesomeIcon 
                                    icon={sortBy === 'sponsorName' ? (sortOrder === 'asc' ? faSortUp : faSortDown) : faSort} 
                                    className={`sponsor-table__sort-icon ${sortBy === 'sponsorName' ? 'active' : ''}`}
                                />
                            </th>
                            <th className="sponsor-table__column-header sponsor-domain-col">Domain</th>
                            <th className="sponsor-table__column-header sponsor-contact-col">Contact Method</th>
                            <th className="sponsor-table__column-header sponsor-newsletter-col">Newsletter Source</th>
                            <th className="sponsor-table__column-header sponsor-actions-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedSponsors.map((sponsor, index) => (
                            <tr key={`${sponsor.sponsorName || index}-${index}`} 
                                className={`sponsor-table__row ${sponsor.isViewed || sponsor.isApplied ? 'sponsor-table__row--inactive' : ''}`}>
                                
                                {/* Sponsor Name */}
                                <td className="sponsor-table__cell sponsor-name-cell">
                                    <div className="sponsor-name-container">
                                        <a 
                                            href={`https://${sponsor.rootDomain}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="sponsor-table__link sponsor-name-link"
                                            onClick={() => handleSponsorClick(sponsor)}
                                        >
                                            {sponsor.sponsorName}
                                            <FontAwesomeIcon 
                                                icon={faExternalLink} 
                                                className="sponsor-table__link-icon" 
                                            />
                                        </a>
                                    </div>
                                </td>
                                
                                {/* Domain */}
                                <td className="sponsor-table__cell sponsor-domain-cell">
                                    <span className="sponsor-domain">{sponsor.rootDomain}</span>
                                </td>
                                
                                {/* Contact Method */}
                                <td className="sponsor-table__cell sponsor-contact-cell">
                                    {sponsor.sponsorEmail ? (
                                        <div className="contact-method">
                                            <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                                            <button 
                                                className="contact-link contact-button"
                                                onClick={() => handleEmailClick(sponsor)}
                                            >
                                                Send Email
                                            </button>
                                        </div>
                                    ) : sponsor.sponsorApplication ? (
                                        <div className="contact-method">
                                            <FontAwesomeIcon icon={faArrowRight} className="contact-icon" />
                                            <a 
                                                href={sponsor.sponsorApplication}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="sponsor-table__link contact-link"
                                                onClick={() => handleContactClick(sponsor)}
                                            >
                                                Complete their partnership form
                                            </a>
                                        </div>
                                    ) : sponsor.businessContact ? (
                                        // Fallback to legacy businessContact field
                                        sponsor.businessContact.includes('@') ? (
                                            <div className="contact-method">
                                                <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                                                <button 
                                                    className="contact-link contact-button"
                                                    onClick={() => handleEmailClick(sponsor)}
                                                >
                                                    Send Email
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="contact-method">
                                                <FontAwesomeIcon icon={faArrowRight} className="contact-icon" />
                                                <a 
                                                    href={sponsor.businessContact}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="sponsor-table__link contact-link"
                                                    onClick={() => handleContactClick(sponsor)}
                                                >
                                                    Complete their partnership form
                                                </a>
                                            </div>
                                        )
                                    ) : (
                                        <span className="no-contact">No contact</span>
                                    )}
                                </td>
                                
                                {/* Newsletter Source */}
                                <td className="sponsor-table__cell sponsor-newsletter-cell">
                                    <span className="sponsor-table__newsletter">{sponsor.newsletterSponsored}</span>
                                </td>
                                
                                {/* Actions */}
                                <td className="sponsor-table__cell sponsor-actions-cell">
                                    <div className="sponsor-actions">
                                        <button 
                                            className="sponsor-action-btn sponsor-view-btn"
                                            onClick={() => handleSponsorClick(sponsor)}
                                            title="View Website"
                                        >
                                            <FontAwesomeIcon icon={faExternalLink} />
                                        </button>
                                        {(sponsor.sponsorEmail || sponsor.sponsorApplication || sponsor.businessContact) && (
                                            <button 
                                                className="sponsor-action-btn sponsor-apply-btn"
                                                onClick={() => {
                                                    if (sponsor.sponsorEmail) {
                                                        handleEmailClick(sponsor);
                                                    } else if (sponsor.sponsorApplication) {
                                                        handleContactClick(sponsor);
                                                    } else if (sponsor.businessContact) {
                                                        sponsor.businessContact.includes('@') ? handleEmailClick(sponsor) : handleContactClick(sponsor);
                                                    }
                                                }}
                                                title={
                                                    sponsor.sponsorEmail ? 'Send Email with Template' : 
                                                    sponsor.sponsorApplication ? 'Open Application' :
                                                    sponsor.businessContact?.includes('@') ? 'Send Email with Template' : 'Open Application'
                                                }
                                            >
                                                <FontAwesomeIcon icon={
                                                    sponsor.sponsorEmail ? faEnvelope :
                                                    sponsor.sponsorApplication ? faHandshake :
                                                    sponsor.businessContact?.includes('@') ? faEnvelope : faHandshake
                                                } />
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                className="sponsor-action-btn sponsor-edit-btn"
                                                onClick={() => handleEdit(sponsor)}
                                                title="Edit Sponsor"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {loading && allSponsors.length > 0 && (
                    <div className="sponsor-table__loading">
                        <FontAwesomeIcon icon={faSpinner} spin className="sponsor-table__loading-icon" />
                        Loading more sponsors...
                    </div>
                )}
                {!loading && hasMore && (
                    <div className="sponsor-table__loading">
                        <span>Scroll to load more sponsors</span>
                    </div>
                )}
                {!loading && !hasMore && displayedSponsors.length > 0 && (
                    <div className="sponsor-table__loading">
                        {displayedSponsors.length} of {sortedSponsors.length} sponsors
                    </div>
                )}
            </div>
        </div>

        {editingSponsor && (
            <div className="sponsor-table__edit-modal">
                <div className="sponsor-table__edit-form">
                    <h3>Edit Sponsor</h3>
                    <form onSubmit={handleEditSubmit}>
                        <div className="sponsor-table__form-group">
                            <label>Sponsor Name</label>
                            <input
                                type="text"
                                value={editFormData.sponsorName || ''}
                                onChange={(e) => setEditFormData({...editFormData, sponsorName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="sponsor-table__form-group">
                            <label>Sponsor Link</label>
                            <input
                                type="url"
                                value={editFormData.sponsorLink || ''}
                                onChange={(e) => setEditFormData({...editFormData, sponsorLink: e.target.value})}
                            />
                        </div>
                        <div className="sponsor-table__form-group">
                            <label>Root Domain</label>
                            <input
                                type="text"
                                value={editFormData.rootDomain || ''}
                                onChange={(e) => setEditFormData({...editFormData, rootDomain: e.target.value})}
                            />
                        </div>
                        <div className="sponsor-table__form-group">
                            <label>Newsletter Sponsored</label>
                            <input
                                type="text"
                                value={editFormData.newsletterSponsored || ''}
                                onChange={(e) => setEditFormData({...editFormData, newsletterSponsored: e.target.value})}
                            />
                        </div>
                        <div className="sponsor-table__form-group">
                            <label>Subscriber Count</label>
                            <input
                                type="number"
                                value={editFormData.subscriberCount || ''}
                                onChange={(e) => setEditFormData({...editFormData, subscriberCount: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div className="sponsor-table__form-group">
                            <label>Business Contact</label>
                            <input
                                type="text"
                                value={editFormData.businessContact || ''}
                                onChange={(e) => setEditFormData({...editFormData, businessContact: e.target.value})}
                            />
                        </div>
                        <div className="sponsor-table__form-group">
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={editFormData.tags?.join(', ') || ''}
                                onChange={(e) => setEditFormData({...editFormData, tags: e.target.value.split(',').map(tag => tag.trim())})}
                            />
                        </div>
                        <div className="sponsor-table__form-actions">
                            <button type="submit" className="sponsor-table__submit-btn">Save Changes</button>
                            <button type="button" className="sponsor-table__cancel-btn" onClick={handleEditCancel}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default PaidSponsorTable; 