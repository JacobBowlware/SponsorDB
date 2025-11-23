import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink, faSpinner, faExclamationTriangle, faSort, faSortUp, faSortDown, faEdit, faEnvelope, faArrowRight, faHandshake, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import { useNavigate } from 'react-router-dom';
import AffiliateProgramsTable from './AffiliateProgramsTable';
import '../css/PaidSponsorTable.css';
import '../css/components/AffiliateProgramsTable.css';
import { trackSponsorCardClicked } from '../utils/funnelTracking';

interface NewsletterSponsored {
    newsletterName: string;
    estimatedAudience: number;
    contentTags: string[];
    dateSponsored: string;
    emailAddress?: string;
}

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string; // Legacy field for backward compatibility
    subscriberCount: number; // Legacy field
    newslettersSponsored?: NewsletterSponsored[]; // New field
    dateSponsored?: string | Date; // Most recent newsletter date
    mostRecentNewsletterDate?: string | Date; // Most recent newsletter date
    totalPlacements?: number; // Total number of newsletter placements
    avgAudienceSize?: number; // Average audience size across all newsletters
    businessContact: string;
    sponsorEmail?: string;
    contactMethod?: 'email' | 'none';
    // Detailed contact info from Gemini
    contactPersonName?: string;
    contactPersonTitle?: string;
    contactType?: 'named_person' | 'business_email' | 'generic_email' | 'not_found';
    confidence?: number;
    analysisStatus?: 'complete' | 'manual_review_required' | 'pending';
    status?: 'pending' | 'approved' | 'rejected' | 'reviewed';
    dateAdded: string;
    isViewed?: boolean;
    isApplied?: boolean;
    dateViewed?: string;
    dateApplied?: string;
    // New structure fields
    contentTags?: string[]; // Tags for this specific newsletter placement
    placementId?: string; // Unique ID for this placement
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
    statusFilter?: string;
    matchedSponsors?: any[]; // Pre-matched sponsors with match scores
    showOneTime?: boolean;
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

// Placements Cell Component - Simple count display only (no expand functionality)
const PlacementsCell: React.FC<{ sponsor: Sponsor }> = ({ sponsor }) => {
    const newsletters = sponsor.newslettersSponsored || [];
    
    // Fallback to legacy format if newslettersSponsored doesn't exist
    const hasPlacements = newsletters.length > 0 || sponsor.newsletterSponsored;
    
    if (!hasPlacements) {
        return <span className="no-placements">No placements</span>;
    }
    
    // If only legacy format, show single newsletter count
    if (newsletters.length === 0 && sponsor.newsletterSponsored) {
        return (
            <span className="placements-count">
                1 newsletter
            </span>
        );
    }
    
    const count = newsletters.length;
    
    return (
        <span className="placements-count">
            {count} newsletter{count !== 1 ? 's' : ''}
        </span>
    );
};

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

// Helper function to format contact information display as single button
const formatContactDisplay = (sponsor: Sponsor, onEmailClick: (sponsor: Sponsor) => void) => {
    const email = sponsor.sponsorEmail || (sponsor.businessContact && sponsor.businessContact.includes('@') ? sponsor.businessContact : null);
    
    if (!email) {
        return <span className="no-contact">No contact</span>;
    }
    
    return (
        <button 
            className="sponsor-contact-btn"
            onClick={(e) => {
                e.stopPropagation();
                onEmailClick(sponsor);
            }}
            title={`Email: ${email}`}
        >
            <FontAwesomeIcon icon={faEnvelope} className="sponsor-contact-icon" />
            <div className="sponsor-contact-content">
                {sponsor.contactPersonTitle && (
                    <div className="sponsor-contact-title">{sponsor.contactPersonTitle}</div>
                )}
                <div className="sponsor-contact-email">{email}</div>
            </div>
        </button>
    );
};

const PaidSponsorTable: React.FC<PaidSponsorTableProps> = ({ onError, activeFilter, isAdmin, searchQuery, sortBy = 'dateSponsored', sortOrder = 'desc', showAffiliatePrograms = false, statusFilter = 'all', matchedSponsors, showOneTime = true, user }) => {
    const navigate = useNavigate();
    const [allSponsors, setAllSponsors] = useState<Sponsor[]>([]);
    const [displayedSponsors, setDisplayedSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [expandedSponsors, setExpandedSponsors] = useState<Set<string>>(new Set());
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
        // If matched sponsors provided, use them directly
        if (matchedSponsors && matchedSponsors.length > 0) {
            setAllSponsors(matchedSponsors);
            setLoading(false);
        } else {
            fetchAllSponsors();
        }
        // Reset page when filters change
        setPage(1);
    }, [showAffiliatePrograms, matchedSponsors]); // Refetch when affiliate toggle changes or matched sponsors update

    // Helper function to determine sponsor status
    const getSponsorStatus = (sponsor: Sponsor) => {
        const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
        const hasBusinessContactEmail = sponsor.businessContact && sponsor.businessContact.includes('@') && sponsor.businessContact.trim() !== '';
        const hasContactInfo = hasEmail || hasBusinessContactEmail;
        
        const isApproved = sponsor.status === 'approved' || sponsor.analysisStatus === 'complete';
        
        if (isApproved && hasContactInfo) {
            return 'complete';
        } else if (!isApproved && hasContactInfo) {
            return 'pending_with_contact';
        } else if (!isApproved && !hasContactInfo) {
            return 'pending_without_contact';
        } else if (isApproved && !hasContactInfo) {
            return 'complete_missing_contact';
        }
        
        return 'pending_without_contact'; // Default fallback
    };

    const filteredSponsors = useMemo(() => {
        let filtered = allSponsors;
        
        // Enforce user-facing constraints: only approved sponsors
        if (!isAdmin) {
            filtered = filtered.filter(s => s.status === 'approved');
        }
        
        // User-facing default: must have contact info unless viewing affiliate programs
        if (!isAdmin && !showAffiliatePrograms) {
            filtered = filtered.filter(sponsor => {
                const hasEmail = sponsor.sponsorEmail && sponsor.sponsorEmail.trim() !== '';
                const hasBusinessContactEmail = sponsor.businessContact && sponsor.businessContact.includes('@') && sponsor.businessContact.trim() !== '';
                return hasEmail || hasBusinessContactEmail;
            });
        }
        
        // Affiliate view: approved affiliates with a valid affiliate application link
        if (!isAdmin && showAffiliatePrograms) {
            filtered = filtered.filter(sponsor => (sponsor.isAffiliateProgram === true || (sponsor.tags && sponsor.tags.includes('Affiliate')))
                && sponsor.affiliateSignupLink && sponsor.affiliateSignupLink.trim() !== '');
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
    }, [allSponsors, activeFilter, searchQuery, showAffiliatePrograms, isAdmin]);

    const sortedSponsors = useMemo(() => {
        return [...filteredSponsors].sort((a, b) => {
            if (sortBy === 'subscriberCount') {
                return sortOrder === 'asc' ? a.subscriberCount - b.subscriberCount : b.subscriberCount - a.subscriberCount;
            } else if (sortBy === 'dateAdded' || sortBy === 'dateSponsored') {
                // Use mostRecentNewsletterDate if available, otherwise fall back to dateSponsored or dateAdded
                const dateA = new Date(a.mostRecentNewsletterDate || a.dateSponsored || a.dateAdded || 0).getTime();
                const dateB = new Date(b.mostRecentNewsletterDate || b.dateSponsored || b.dateAdded || 0).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortBy === 'sponsorName') {
                return sortOrder === 'asc' ? a.sponsorName.localeCompare(b.sponsorName) : b.sponsorName.localeCompare(a.sponsorName);
            } else if (sortBy === 'matchScore') {
                const scoreA = (a as any).matchScore || 0;
                const scoreB = (b as any).matchScore || 0;
                return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
            }
            return 0;
        });
    }, [filteredSponsors, sortBy, sortOrder]);

    // Update displayed sponsors when filter changes or page changes
    useEffect(() => {
        const startIndex = 0;
        const endIndex = page * ITEMS_PER_PAGE;
        const newDisplayedSponsors = sortedSponsors.slice(startIndex, endIndex);
        setDisplayedSponsors(newDisplayedSponsors);
        setHasMore(endIndex < sortedSponsors.length);
        console.log(`Pagination: Showing ${newDisplayedSponsors.length} of ${sortedSponsors.length} sponsors (page ${page} of ${Math.ceil(sortedSponsors.length / ITEMS_PER_PAGE)})`);
    }, [sortedSponsors, page]);

    // Calculate total pages
    const totalPages = Math.ceil(sortedSponsors.length / ITEMS_PER_PAGE);
    
    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 7; // Show max 7 page buttons
        
        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            if (page > 3) {
                pages.push('...');
            }
            
            // Show pages around current page
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (page < totalPages - 2) {
                pages.push('...');
            }
            
            // Always show last page
            pages.push(totalPages);
        }
        
        return pages;
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            // Scroll to top of table when page changes
            const tableContainer = document.querySelector('.sponsor-table-container');
            if (tableContainer) {
                tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

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

    const handleSponsorClick = (sponsor: Sponsor) => {
        // Track sponsor card clicked (funnel tracking)
        trackSponsorCardClicked(sponsor.sponsorName || sponsor.rootDomain || 'unknown');
        
        if (!sponsor.isViewed) {
            markAsViewed(sponsor._id);
        }
        // Open sponsor website
        window.open(`https://${sponsor.rootDomain}`, '_blank');
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
        if (!sponsor.isApplied) {
            markAsApplied(sponsor._id);
        }
        if (!sponsor.isViewed) {
            markAsViewed(sponsor._id);
        }
        
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

    // Show affiliate programs table if toggle is on (check BEFORE mobile/desktop view)
    if (showAffiliatePrograms) {
        return (
            <AffiliateProgramsTable 
                onError={onError || (() => {})} 
                user={user}
                isMobile={isMobile}
            />
        );
    }

    // Mobile view - Sponsor cards
    if (isMobile) {
        return (
            <div className="mobile-sponsors-grid">
                {displayedSponsors.length > 0 ? (
                    displayedSponsors.map((sponsor) => {
                        const newsletters = sponsor.newslettersSponsored || [];
                        const isExpanded = expandedSponsors.has(sponsor._id);
                        // Collect all unique contentTags from newsletters
                        const allTags = new Set<string>();
                        newsletters.forEach(newsletter => {
                            if (newsletter.contentTags && newsletter.contentTags.length > 0) {
                                newsletter.contentTags.forEach(tag => allTags.add(tag));
                            }
                        });
                        const displayTags = Array.from(allTags).length > 0 
                            ? Array.from(allTags) 
                            : (sponsor.tags || []);
                        
                        return (
                            <div key={sponsor._id} className="sponsor-card">
                                <div className="sponsor-card-header">
                                    <div>
                                        <h3 
                                            className="sponsor-name sponsor-name-clickable"
                                            onClick={() => handleSponsorClick(sponsor)}
                                        >
                                            {sponsor.sponsorName}
                                            <FontAwesomeIcon icon={faExternalLink} className="sponsor-name-link-icon" />
                                        </h3>
                                    </div>
                                    {(sponsor as any).matchScore !== undefined && (
                                        <div className="sponsor-match-badge">
                                            <span className="match-score">{(sponsor as any).matchScore}% Match</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Market Tags */}
                                {displayTags.length > 0 && (
                                    <div className="sponsor-tags">
                                        {displayTags.slice(0, 5).map((tag, index) => (
                                            <span key={index} className="sponsor-tag">{tag}</span>
                                        ))}
                                        {displayTags.length > 5 && (
                                            <span className="sponsor-tag">+{displayTags.length - 5}</span>
                                        )}
                                    </div>
                                )}
                                
                                {/* Contact Section */}
                                <div className="sponsor-contact-section">
                                    {formatContactDisplay(sponsor, handleEmailClick)}
                                </div>
                                
                                {/* Expandable Newsletter Placements Section */}
                                {newsletters.length > 0 && (
                                    <>
                                        <button 
                                            className="sponsor-expand-newsletters-btn"
                                            onClick={() => toggleSponsorExpansion(sponsor._id)}
                                        >
                                            <span>{isExpanded ? 'Hide' : 'Show'} Newsletter Placements ({newsletters.length})</span>
                                            <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                                        </button>
                                        {isExpanded && (
                                            <div className="sponsor-newsletters-section">
                                                <div className="sponsor-newsletters-header">
                                                    <h4>Newsletter Placements ({newsletters.length})</h4>
                                                    {sponsor.avgAudienceSize && newsletters.length > 1 && (
                                                        <span className="avg-audience-badge-mobile">
                                                            Avg: {sponsor.avgAudienceSize.toLocaleString()} readers
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="sponsor-newsletters-list">
                                                    {newsletters.map((newsletter, idx) => (
                                                        <div key={idx} className="sponsor-newsletter-item-mobile">
                                                            <div className="newsletter-item-header-mobile">
                                                                <strong className="newsletter-name-mobile">
                                                                    {newsletter.newsletterName || 'Unnamed Newsletter'}
                                                                </strong>
                                                            </div>
                                                            <span className="newsletter-date-mobile">
                                                                    {new Date(newsletter.dateSponsored || sponsor.dateAdded).toLocaleDateString()}
                                                            </span>
                                                            <div className="newsletter-item-body-mobile">
                                                                <div className="newsletter-stat-mobile">
                                                                    <span className="stat-label-mobile">Audience:</span>
                                                                    <span className="stat-value-mobile">
                                                                        {newsletter.estimatedAudience ? newsletter.estimatedAudience.toLocaleString() : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                {newsletter.contentTags && newsletter.contentTags.length > 0 && (
                                                                    <div className="newsletter-tags-mobile">
                                                                        {newsletter.contentTags.map((tag, tagIdx) => (
                                                                            <span key={tagIdx} className="content-tag-badge-mobile">{tag}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="mobile-no-results">
                        <p>No sponsors found. Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>
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
                            {/* <th className="sponsor-table__column-header sponsor-domain-col">Domain</th> */}
                            <th className="sponsor-table__column-header sponsor-contact-col">Sponsor Contact</th>
                            <th className="sponsor-table__column-header sponsor-placements-col">Placements</th>
                            <th className="sponsor-table__column-header sponsor-market-col">Market</th>
                            <th className="sponsor-table__column-header sponsor-actions-col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedSponsors.map((sponsor, index) => {
                            const isExpanded = expandedSponsors.has(sponsor._id);
                            const newsletters = sponsor.newslettersSponsored || [];
                            
                            return (
                                <React.Fragment key={`${sponsor._id}-${index}`}>
                                    <tr 
                                        className={`sponsor-table__row ${sponsor.isViewed || sponsor.isApplied ? 'sponsor-table__row--inactive' : ''} ${(sponsor as any).matchScore ? 'sponsor-table__row--matched' : ''} ${isExpanded ? 'sponsor-table__row--expanded' : ''}`}
                                    >
                                        {/* Sponsor Name */}
                                        <td className="sponsor-table__cell sponsor-name-cell">
                                            <div className="sponsor-name-container">
                                                {newsletters.length > 0 && (
                                                    <button
                                                        className="sponsor-expand-toggle"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSponsorExpansion(sponsor._id);
                                                        }}
                                                        title={isExpanded ? 'Collapse details' : `Expand to see ${newsletters.length} newsletter${newsletters.length !== 1 ? 's' : ''}`}
                                                    >
                                                        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                                                    </button>
                                                )}
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
                                                {(sponsor as any).matchScore !== undefined && (
                                                    <span className="match-score-badge">{(sponsor as any).matchScore}% Match</span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        {/* Domain */}
                                        {/* <td className="sponsor-table__cell sponsor-domain-cell">
                                            <span className="sponsor-domain">{sponsor.rootDomain}</span>
                                        </td> */}
                                        
                                        {/* Sponsor Contact */}
                                        <td className="sponsor-table__cell sponsor-contact-cell">
                                            {formatContactDisplay(sponsor, handleEmailClick)}
                                        </td>
                                        
                                        {/* Placements Column */}
                                        <td className="sponsor-table__cell sponsor-placements-cell">
                                            <PlacementsCell sponsor={sponsor} />
                                        </td>
                                        
                                        {/* Market Column - Aggregate tags from all newsletters */}
                                        <td className="sponsor-table__cell sponsor-market-cell">
                                            {(() => {
                                                // Collect all unique contentTags from newsletters
                                                const allTags = new Set<string>();
                                                newsletters.forEach(newsletter => {
                                                    if (newsletter.contentTags && newsletter.contentTags.length > 0) {
                                                        newsletter.contentTags.forEach(tag => allTags.add(tag));
                                                    }
                                                });
                                                // Fallback to sponsor tags if no newsletter tags
                                                const displayTags = Array.from(allTags).length > 0 
                                                    ? Array.from(allTags) 
                                                    : (sponsor.tags || []);
                                                
                                                if (displayTags.length === 0) {
                                                    return <span className="no-tags">No tags</span>;
                                                }
                                                
                                                return (
                                                    <div className="market-tags-inline">
                                                        {displayTags.slice(0, 3).map((tag, idx) => (
                                                            <span key={idx} className="market-tag-inline">{tag}</span>
                                                        ))}
                                                        {displayTags.length > 3 && (
                                                            <span className="more-tags" title={displayTags.slice(3).join(', ')}>
                                                                +{displayTags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
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
                                                {(sponsor.sponsorEmail || (sponsor.businessContact && sponsor.businessContact.includes('@'))) && (
                                                    <button 
                                                        className="sponsor-action-btn sponsor-apply-btn"
                                                        onClick={() => handleEmailClick(sponsor)}
                                                        title="Send Email with Template"
                                                    >
                                                        <FontAwesomeIcon icon={faEnvelope} />
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
                                    {isExpanded && newsletters.length > 0 && (
                                        <tr className="sponsor-table__details-row">
                                            <td colSpan={6}>
                                                <div className="sponsor-expanded-details">
                                                    <div className="expanded-details-header">
                                                        <h4>Newsletter Placements ({newsletters.length})</h4>
                                                        {sponsor.avgAudienceSize && newsletters.length > 1 && (
                                                            <span className="avg-audience-badge">
                                                                Avg Audience: {sponsor.avgAudienceSize.toLocaleString()} readers
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="newsletters-grid">
                                                        {newsletters.map((newsletter, idx) => (
                                                            <div key={idx} className="newsletter-card">
                                                                <div className="newsletter-card-header">
                                                                    <strong className="newsletter-name">{newsletter.newsletterName || 'Unnamed Newsletter'}</strong>
                                                                    <span className="newsletter-date">
                                                                        {new Date(newsletter.dateSponsored || sponsor.dateAdded).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="newsletter-card-body">
                                                                    <div className="newsletter-stat">
                                                                        <span className="stat-label">Audience:</span>
                                                                        <span className="stat-value">{newsletter.estimatedAudience ? newsletter.estimatedAudience.toLocaleString() : 'N/A'}</span>
                                                                    </div>
                                                                    {newsletter.contentTags && newsletter.contentTags.length > 0 && (
                                                                        <div className="newsletter-tags">
                                                                            {newsletter.contentTags.map((tag, tagIdx) => (
                                                                                <span key={tagIdx} className="content-tag-badge">{tag}</span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
                
                {loading && allSponsors.length > 0 && (
                    <div className="sponsor-table__loading">
                        <FontAwesomeIcon icon={faSpinner} spin className="sponsor-table__loading-icon" />
                        Loading sponsors...
                    </div>
                )}
                
                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="sponsor-table__pagination">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            aria-label="Previous page"
                        >
                            Previous
                        </button>
                        
                        <div className="pagination-pages">
                            {getPageNumbers().map((pageNum, idx) => {
                                if (pageNum === '...') {
                                    return <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        className={`pagination-page ${page === pageNum ? 'active' : ''}`}
                                        onClick={() => handlePageChange(pageNum as number)}
                                        aria-label={`Go to page ${pageNum}`}
                                        aria-current={page === pageNum ? 'page' : undefined}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            aria-label="Next page"
                        >
                            Next
                        </button>
                    </div>
                )}
                
                {!loading && displayedSponsors.length > 0 && (
                    <div className="sponsor-table__pagination-info">
                        Showing {displayedSponsors.length} of {sortedSponsors.length} sponsors
                        {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
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