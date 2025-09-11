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
    faUsers
} from "@fortawesome/free-solid-svg-icons";
import PaidSponsorTable from "../../components/PaidSponsorTable";
import axios from 'axios';
import config from '../../config';
import { loadStripe } from '@stripe/stripe-js';
import '../../css/Sponsors.css';

interface SponsorsProps {
    sponsors: number;
    newsletters: number;
    lastUpdated: string;
    isSubscribed: boolean | string | null;
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
        console.log("Error subscribing", error);
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

const Sponsors = ({ sponsors, newsletters, lastUpdated, isSubscribed }: SponsorsProps) => {
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('dateAdded');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    // Convert subscription to boolean for backward compatibility
    const hasSubscription = Boolean(isSubscribed);


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



    if (hasSubscription) {
        return (
            <div className="web-page">
                <div className="web-section web-section-dark mt-0">
                    <div className="web-section__container web-section-content">
                        <div className="sponsors-page-container">
                            {/* Enhanced Header Section */}
                            <div className="sponsors-page-header">
                                <div className="sponsors-page-header-content">
                                    <h1 className="sponsors-page-title">
                                        Newsletter Sponsor Database
                                    </h1>
                                    <p className="sponsors-page-subtitle">
                                        Access our complete database of <strong>{sponsors}</strong> sponsors from <strong>{newsletters}</strong> newsletters.
                                        Last updated: {new Date(lastUpdated).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>



                                                        {/* Unified Grid Options Module */}
                            <div className="grid-options-module">
                                <div className="grid-options-header">
                                    <h3>Find Sponsors</h3>
                                    <div className="grid-options-actions">
                                        {activeFilters.length > 0 && (
                                            <button className="clear-filters-btn" onClick={clearAllFilters}>
                                                <FontAwesomeIcon icon={faTimes} />
                                                Clear All ({activeFilters.length})
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid-options-content">
                                    {/* Search Row */}
                                    <div className="grid-options-row search-row">
                                        <div className="search-input-wrapper">
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
                                            <button className="search-btn-inside">
                                                <FontAwesomeIcon icon={faSearch} />
                                                Search
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Filters Row */}
                                    <div className="grid-options-row filters-row">
                                        <div className="filters-label">Categories:</div>
                                        <div className="filters-grid">
                                            {FILTER_CATEGORIES.map((category) => (
                                                <button
                                                    key={category.key}
                                                    className={`filter-chip ${isFilterActive(category.key) ? 'active' : ''}`}
                                                    onClick={() => handleFilterToggle(category.key)}
                                                    style={{
                                                        '--filter-color': category.color
                                                    } as React.CSSProperties}
                                                >
                                                    <FontAwesomeIcon icon={category.icon} className="filter-icon" />
                                                    <span>{category.label}</span>
                                                    {isFilterActive(category.key) && (
                                                        <FontAwesomeIcon icon={faCheckCircle} className="filter-check" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Sorting Row */}
                                    <div className="grid-options-row sorting-row">
                                        <div className="sorting-label">Sort by:</div>
                                        <div className="sorting-options">
                                            <button 
                                                className={`sort-option ${sortBy === 'dateAdded' ? 'active' : ''}`}
                                                onClick={() => handleSort('dateAdded')}
                                            >
                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                Date Added
                                                <FontAwesomeIcon 
                                                    icon={sortBy === 'dateAdded' ? (sortOrder === 'asc' ? faArrowTrendUp : faArrowTrendUp) : faSort} 
                                                    className="sort-indicator"
                                                />
                                            </button>
                                            <button 
                                                className={`sort-option ${sortBy === 'subscriberCount' ? 'active' : ''}`}
                                                onClick={() => handleSort('subscriberCount')}
                                            >
                                                <FontAwesomeIcon icon={faUsers} />
                                                Audience Size
                                                <FontAwesomeIcon 
                                                    icon={sortBy === 'subscriberCount' ? (sortOrder === 'asc' ? faArrowTrendUp : faArrowTrendUp) : faSort} 
                                                    className="sort-indicator"
                                                />
                                            </button>
                                            <button 
                                                className={`sort-option ${sortBy === 'sponsorName' ? 'active' : ''}`}
                                                onClick={() => handleSort('sponsorName')}
                                            >
                                                <FontAwesomeIcon icon={faBuilding} />
                                                Name
                                                <FontAwesomeIcon 
                                                    icon={sortBy === 'sponsorName' ? (sortOrder === 'asc' ? faArrowTrendUp : faArrowTrendUp) : faSort} 
                                                    className="sort-indicator"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Table Section */}
                            <div className="sponsors-content-section">
                                <div className="sponsors-table-wrapper">
                                    <PaidSponsorTable 
                                        onError={setError} 
                                        activeFilter={activeFilters.join(',')} 
                                        isAdmin={isAdmin} 
                                        searchQuery={searchQuery}
                                        sortBy={sortBy}
                                        sortOrder={sortOrder}
                                    />
                                </div>
                            </div>

                            {/* Results Summary - Moved below table */}
                            <div className="results-summary">
                                <div className="results-count">
                                    Showing results for {activeFilters.length > 0 ? activeFilters.join(', ') : 'all categories'}
                                    {searchQuery && ` matching "${searchQuery}"`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className="web-page">
                <div className="web-section web-section-dark mt-0">
                    <div className="web-section__container web-section-content">
                        <div className="sponsor-purchase__layout">
                            {/* Left side - Purchase card */}
                            <div className="sponsor-purchase__card-section">
                                <div className="sponsor-purchase__card">
                                    <div className="sponsor-purchase__price-section">
                                        <div className="sponsor-purchase__price">
                                            <span className="sponsor-purchase__currency">$</span>
                                            <span className="sponsor-purchase__amount">64</span>
                                            <span className="sponsor-purchase__cents">.99</span>
                                        </div>
                                        <div className="sponsor-purchase__price-label">One-time payment</div>
                                    </div>
                                    
                                    <div className="sponsor-purchase__benefits">
                                        <div className="sponsor-purchase__benefit">
                                            <FontAwesomeIcon icon={faCheckCircle} className="sponsor-purchase__benefit-icon" />
                                            <span><strong>{sponsors}+ Sponsors:</strong> From companies like Eight Sleep, ExpressVPN, and EmailTree.</span>
                                        </div>
                                        <div className="sponsor-purchase__benefit">
                                            <FontAwesomeIcon icon={faCheckCircle} className="sponsor-purchase__benefit-icon" />
                                            <span><strong>Direct Contacts:</strong> No middleman, no hidden fees, no commissions.</span>
                                        </div>
                                        <div className="sponsor-purchase__benefit">
                                            <FontAwesomeIcon icon={faCheckCircle} className="sponsor-purchase__benefit-icon" />
                                            <span><strong>Advanced Filters:</strong> Sort by market type or audience size to find the perfect sponsors.</span>
                                        </div>
                                        <div className="sponsor-purchase__benefit">
                                            <FontAwesomeIcon icon={faCheckCircle} className="sponsor-purchase__benefit-icon" />
                                            <span><strong>Regular Updates:</strong> New sponsors added every week – never miss an opportunity.</span>
                                        </div>
                                    </div>
                                    
                                    <button className="sponsor-purchase__cta-button" onClick={handlePurchase}>
                                        Get Started
                                    </button>
                                </div>
                            </div>

                            {/* Right side - Engaging content */}
                            <div className="sponsor-purchase__content-section">
                                {/* Image Showcase */}
                                <div className="sponsor-purchase__image-showcase">
                                    <h3 className="sponsor-purchase__showcase-title">
                                        See What You're Getting
                                    </h3>
                                    <div className="sponsor-purchase__image-container">
                                        <div className="sponsor-purchase__image-placeholder sponsor-purchase__image--database">
                                            <div className="sponsor-purchase__image-overlay">
                                                <FontAwesomeIcon icon={faDatabase} />
                                                <span>Database</span>
                                            </div>
                                        </div>
                                        <div className="sponsor-purchase__image-placeholder sponsor-purchase__image--application">
                                            <div className="sponsor-purchase__image-overlay">
                                                <FontAwesomeIcon icon={faEnvelope} />
                                                <span>Applications</span>
                                            </div>
                                        </div>
                                        <div className="sponsor-purchase__image-placeholder sponsor-purchase__image--developer">
                                            <div className="sponsor-purchase__image-overlay">
                                                <FontAwesomeIcon icon={faLaptopCode} />
                                                <span>Active Dev</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sponsor-purchase__features">
                                    <h3 className="sponsor-purchase__features-title">
                                        What You'll Get
                                    </h3>
                                    
                                    <div className="sponsor-purchase__feature-list">
                                        <div className="sponsor-purchase__feature-item">
                                            <div className="sponsor-purchase__feature-icon">
                                                <FontAwesomeIcon icon={faDatabase} />
                                            </div>
                                            <div className="sponsor-purchase__feature-content">
                                                <h4>Complete Database Access</h4>
                                                <p>Browse {sponsors}+ verified sponsors with direct contact information</p>
                                            </div>
                                        </div>

                                        <div className="sponsor-purchase__feature-item">
                                            <div className="sponsor-purchase__feature-icon">
                                                <FontAwesomeIcon icon={faLaptopCode} />
                                            </div>
                                            <div className="sponsor-purchase__feature-content">
                                                <h4>Smart Filtering</h4>
                                                <p>Filter by niche, audience size, and sponsorship type</p>
                                            </div>
                                        </div>

                                        <div className="sponsor-purchase__feature-item">
                                            <div className="sponsor-purchase__feature-icon">
                                                <FontAwesomeIcon icon={faClock} />
                                            </div>
                                            <div className="sponsor-purchase__feature-content">
                                                <h4>Save Hours Weekly</h4>
                                                <p>Skip the research and focus on creating great content</p>
                                            </div>
                                        </div>

                                        <div className="sponsor-purchase__feature-item">
                                            <div className="sponsor-purchase__feature-icon">
                                                <FontAwesomeIcon icon={faChartLine} />
                                            </div>
                                            <div className="sponsor-purchase__feature-content">
                                                <h4>Boost Your Revenue</h4>
                                                <p>Newsletter creators earn 3x more with our insights</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sponsor-purchase__stats">
                                    <div className="sponsor-purchase__stat">
                                        <div className="sponsor-purchase__stat-number">{sponsors}+</div>
                                        <div className="sponsor-purchase__stat-label">Active Sponsors</div>
                                    </div>
                                    <div className="sponsor-purchase__stat">
                                        <div className="sponsor-purchase__stat-number">{newsletters}+</div>
                                        <div className="sponsor-purchase__stat-label">Newsletters</div>
                                    </div>
                                    <div className="sponsor-purchase__stat">
                                        <div className="sponsor-purchase__stat-number">Weekly</div>
                                        <div className="sponsor-purchase__stat-label">New Updates</div>
                                    </div>
                                </div>

                                <div className="sponsor-purchase__testimonial">
                                    <div className="sponsor-purchase__testimonial-content">
                                        <p>"Found 3 sponsors in my first week using SponsorDB. The database is incredible!"</p>
                                        <div className="sponsor-purchase__testimonial-author">
                                            - Sarah K., Tech Newsletter
                                        </div>
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