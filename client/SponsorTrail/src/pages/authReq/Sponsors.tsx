import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faDatabase, 
    faLaptopCode, 
    faHeartbeat, 
    faGraduationCap, 
    faGamepad, 
    faBullhorn, 
    faBuilding, 
    faGlobe, 
    faClock, 
    faChartLine, 
    faCheckCircle, 
    faEnvelope, 
    faFilter, 
    faSearch, 
    faInfoCircle, 
    faTimes,
    faEye,
    faSort,
    faDownload,
    faCalendarAlt,
    faArrowTrendUp,
    faUsers,
    faLock
} from "@fortawesome/free-solid-svg-icons";
import PaidSponsorTable from "../../components/PaidSponsorTable";
import axios from 'axios';
import config from '../../config';
import { loadStripe } from '@stripe/stripe-js';
import '../../css/Sponsors.css';
import { trackSponsorsTabViewed } from '../../utils/funnelTracking';
import { useNavigate } from 'react-router-dom';

interface SponsorsProps {
    sponsors: number;
    newsletters: number;
    lastUpdated: string;
    isSubscribed: boolean | string | null;
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

const stripeAPIKey = "pk_live_51MpGntBKPgChhmNg9wLgFqQICAjXSVAzaEMRKwXjuLQeZZhwghaiA7VDoG0Cov9uEnDGF9RlAKQkQ1xXPSooAX8D00Mp9uCFyO";
const stripePromise = loadStripe(stripeAPIKey);

const handlePurchase = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }
        const response = await axios.post(`${config.backendUrl}users/checkout`, { plan: 'pro' },
            {
                headers: {
                    'x-auth-token': token
                }
            });

        const sessionId = response.data.sessionId;
        const stripe = await stripePromise;
        await stripe?.redirectToCheckout({
            sessionId: sessionId
        });

    } catch (error) {
        // Error subscribing handled silently
    }
}

// Enhanced filter categories with better organization
const FILTER_CATEGORIES = [
    { key: 'technology', label: 'Technology', icon: faLaptopCode, color: '#3B82F6' },
    { key: 'health', label: 'Health & Wellness', icon: faHeartbeat, color: '#10B981' },
    { key: 'education', label: 'Education', icon: faGraduationCap, color: '#8B5CF6' },
    { key: 'entertainment', label: 'Entertainment', icon: faGamepad, color: '#F59E0B' },
    { key: 'marketing', label: 'Marketing', icon: faBullhorn, color: '#EF4444' },
    { key: 'business', label: 'Business', icon: faBuilding, color: '#6B7280' },
    { key: 'finance', label: 'Finance', icon: faChartLine, color: '#059669' },
    { key: 'lifestyle', label: 'Lifestyle', icon: faGlobe, color: '#EC4899' }
];

// Status filter removed from user-facing UI (internal use only)

const Sponsors = ({ sponsors, newsletters, lastUpdated, isSubscribed, user }: SponsorsProps) => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('dateAdded');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showAffiliatePrograms, setShowAffiliatePrograms] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'matched'>('all');
    const [matchedSponsors, setMatchedSponsors] = useState<any[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [hasOnboarding, setHasOnboarding] = useState(false);
    // Status filter not exposed to users; filtering enforced in table
    
    // Set admin status from user prop
    useEffect(() => {
        setIsAdmin(user?.isAdmin === true);
    }, [user]);
    
    // Convert subscription to boolean for backward compatibility
    const hasSubscription = Boolean(isSubscribed);
    // Allow admins to access even without subscription
    const canAccess = hasSubscription || user?.isAdmin === true;
    
    // CRITICAL: Redirect non-subscribed, non-admin users to /subscribe
    useEffect(() => {
        if (!canAccess) {
            navigate('/subscribe', { replace: true });
        }
    }, [canAccess, navigate]);
    
    // Track sponsors tab viewed (funnel tracking)
    useEffect(() => {
        if (canAccess) {
            trackSponsorsTabViewed();
        }
    }, [canAccess]);
    
    // Check if user has completed onboarding
    useEffect(() => {
        const hasTopic = user?.newsletterInfo?.topic && user.newsletterInfo.topic.length > 0;
        setHasOnboarding(hasTopic || false);
    }, [user]);
    
    // Fetch matched sponsors when tab is switched to matched
    useEffect(() => {
        if (activeTab === 'matched' && hasOnboarding && matchedSponsors.length === 0) {
            fetchMatchedSponsors();
        }
    }, [activeTab, hasOnboarding]);
    
    const fetchMatchedSponsors = async () => {
        try {
            setLoadingMatches(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}sponsors/matched`, {
                headers: { 'x-auth-token': token }
            });
            
            if (response.data.success) {
                setMatchedSponsors(response.data.sponsors || []);
            }
        } catch (error: any) {
            console.error('Error fetching matched sponsors:', error);
            setError('Failed to load matched sponsors');
        } finally {
            setLoadingMatches(false);
        }
    };


    // Enhanced filter handling with multi-selection
    const handleFilterToggle = (filterKey: string) => {
        setActiveFilters(prev => {
            if (prev.includes(filterKey)) {
                return prev.filter(f => f !== filterKey);
            } else {
                return [...prev, filterKey];
            }
        });
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
    };

    const isFilterActive = (filterKey: string) => {
        return activeFilters.includes(filterKey);
    };

    // Enhanced sorting
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };



    if (canAccess) {
        return (
            <div className="sponsors-page">
                <div className="sponsors-page-container">
                    {/* Professional Header Section */}
                    <div className="sponsors-page-header">
                        <h1 className="sponsors-page-title">
                            Sponsors
                        </h1>
                        <p className="sponsors-page-subtitle">
                            <strong>{sponsors}</strong> companies actively sponsoring <strong>{newsletters}</strong> newsletters.
                        </p>
                        <p className="sponsors-page-description">
                            View their placements, audience stats, and contact their marketing, press, or partnership email directly.
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="sponsors-tabs">
                        <button 
                            className={`sponsors-tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            <FontAwesomeIcon icon={faDatabase} />
                            All Sponsors
                        </button>
                        <button 
                            className={`sponsors-tab ${activeTab === 'matched' ? 'active' : ''} ${!hasOnboarding ? 'locked' : ''}`}
                            onClick={() => hasOnboarding && setActiveTab('matched')}
                            title={!hasOnboarding ? 'Complete newsletter onboarding to unlock matched sponsors' : ''}
                        >
                            <FontAwesomeIcon icon={activeTab === 'matched' && hasOnboarding ? faCheckCircle : faDatabase} />
                            Best Matches
                            {!hasOnboarding && <FontAwesomeIcon icon={faLock} className="lock-icon" />}
                        </button>
                    </div>

                    {/* Professional Search & Filter Module */}
                    {activeTab === 'all' && (
                    <div className="sponsors-controls-section">
                        <div className="sponsors-controls-header">
                            <h3>Find Your Perfect Sponsors</h3>
                            <div className="sponsors-controls-actions">
                                {activeFilters.length > 0 && (
                                    <button className="clear-filters-btn" onClick={clearAllFilters}>
                                        <FontAwesomeIcon icon={faTimes} />
                                        Clear All ({activeFilters.length})
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="sponsors-controls-content">
                            {/* Search Row */}
                            <div className="search-section">
                                <div className="search-box">
                                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                                    <input 
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search sponsors, newsletters, or tags..."
                                        className="search-input"
                                    />
                                    {searchQuery && (
                                        <button 
                                            className="search-clear-btn"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Filters Row */}
                            <div className="filters-section">
                                <div className="filters-grid">
                                    {FILTER_CATEGORIES.map((category) => (
                                        <button
                                            key={category.key}
                                            className={`filter-btn ${isFilterActive(category.key) ? 'active' : ''}`}
                                            onClick={() => handleFilterToggle(category.key)}
                                        >
                                            <FontAwesomeIcon icon={category.icon} />
                                            <span>{category.label}</span>
                                            {isFilterActive(category.key) && (
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Status filter hidden in user-facing UI */}
                            
                            {/* Sorting Row */}
                            <div className="sorting-section">
                                <div className="sorting-options">
                                    <button 
                                        className={`sort-btn ${sortBy === 'dateAdded' ? 'active' : ''}`}
                                        onClick={() => handleSort('dateAdded')}
                                    >
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        Date Added
                                        <FontAwesomeIcon 
                                            icon={sortBy === 'dateAdded' ? (sortOrder === 'asc' ? faArrowTrendUp : faArrowTrendUp) : faSort} 
                                        />
                                    </button>
                                    <button 
                                        className={`sort-btn ${sortBy === 'subscriberCount' ? 'active' : ''}`}
                                        onClick={() => handleSort('subscriberCount')}
                                    >
                                        <FontAwesomeIcon icon={faUsers} />
                                        Audience Size
                                        <FontAwesomeIcon 
                                            icon={sortBy === 'subscriberCount' ? (sortOrder === 'asc' ? faArrowTrendUp : faArrowTrendUp) : faSort} 
                                        />
                                    </button>
                                    <button 
                                        className={`sort-btn ${sortBy === 'sponsorName' ? 'active' : ''}`}
                                        onClick={() => handleSort('sponsorName')}
                                    >
                                        <FontAwesomeIcon icon={faBuilding} />
                                        Name
                                        <FontAwesomeIcon 
                                            icon={sortBy === 'sponsorName' ? (sortOrder === 'asc' ? faArrowTrendUp : faArrowTrendUp) : faSort} 
                                        />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Affiliate Programs Toggle */}
                            <div className="affiliate-toggle-section">
                                <div className="affiliate-toggle-container">
                                    <label className="affiliate-toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={showAffiliatePrograms}
                                            onChange={(e) => setShowAffiliatePrograms(e.target.checked)}
                                            className="affiliate-toggle-input"
                                        />
                                        <span className="affiliate-toggle-slider"></span>
                                        <span className="affiliate-toggle-text">
                                            Show Affiliate Programs
                                        </span>
                                    </label>
                                    <div className="affiliate-toggle-info">
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <span>Affiliate programs pay commissions instead of direct sponsorships</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Matched Sponsors Section */}
                    {activeTab === 'matched' && (
                        <div className="sponsors-matched-section">
                            {!hasOnboarding ? (
                                <div className="sponsors-matched-locked">
                                    <FontAwesomeIcon icon={faDatabase} className="locked-icon" />
                                    <h3>Unlock Personalized Sponsor Matches</h3>
                                    <p>
                                        Complete your newsletter onboarding to see sponsors that match your newsletter's topic and audience.
                                    </p>
                                    <a href="/signup-flow/" className="btn btn-primary">
                                        Complete Onboarding
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <div className="sponsors-matched-header">
                                        <h3>Your Best Matches</h3>
                                        <p>Sponsors that align with your newsletter's topic and audience</p>
                                    </div>
                                    {loadingMatches ? (
                                        <div className="sponsors-matched-loading">
                                            <FontAwesomeIcon icon={faClock} spin />
                                            <span>Finding your matches...</span>
                                        </div>
                                    ) : matchedSponsors.length === 0 ? (
                                        <div className="sponsors-matched-empty">
                                            <FontAwesomeIcon icon={faInfoCircle} />
                                            <p>No matches found. Try updating your newsletter profile or browse all sponsors.</p>
                                        </div>
                                    ) : (
                                        <div className="sponsors-matched-content">
                                            <PaidSponsorTable 
                                                onError={setError} 
                                                activeFilter="" 
                                                isAdmin={isAdmin} 
                                                searchQuery=""
                                                sortBy="matchScore"
                                                sortOrder="desc"
                                                user={user}
                                                showAffiliatePrograms={false}
                                                matchedSponsors={matchedSponsors}
                                                showOneTime={false}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Professional Table Section */}
                    {activeTab === 'all' && (
                    <div className="sponsors-table-section">
                        <div className="sponsors-table-header">
                            <h3>Available Sponsors</h3>
                            <div className="results-count">
                                {activeFilters.length > 0 ? activeFilters.join(', ') : 'all categories'}
                                {searchQuery && ` matching "${searchQuery}"`}
                            </div>
                        </div>
                        <div className="sponsors-table-content">
                            <PaidSponsorTable 
                                onError={setError} 
                                activeFilter={activeFilters.join(',')} 
                                isAdmin={isAdmin} 
                                searchQuery={searchQuery}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                user={user}
                                showAffiliatePrograms={showAffiliatePrograms}
                            />
                        </div>
                    </div>
                    )}
                </div>
            </div>
        );
    } else {
        return (
            <div className="web-page">
                <div className="web-section web-section-dark mt-0">
                    <div className="web-section__container web-section-content">
                        <div style={{ margin: '0 auto', maxWidth: 1000 }}>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <h2>Unlock the Sponsor Database</h2>
                                <p>Choose a plan to access {sponsors}+ companies actively sponsoring {newsletters}+ newsletters.</p>
                            </div>
                            {/* Reuse Pricing component for subscription */}
                            {/* Using dynamic import replacement to avoid circular deps */}
                            <div>
                                {/* Inline lightweight pricing UI */}
                                <div className="subscribe__card-cont authed_subcribe-cont">
                                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <button className="btn" onClick={() => handlePurchase()}>Subscribe to Pro - $79/mo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
};

export default Sponsors;