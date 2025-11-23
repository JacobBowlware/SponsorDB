// React
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, memo, useCallback } from 'react';
import axios from 'axios';

// Components
import FAQAccordian from "../components/FAQAccordian";
import RecentSponsorsCarousel from "../components/RecentSponsorsCarousel";
import { User } from "../types/User";
import config from '../config';

// Images
import SponsorImage from "../assets/images/Sponsor.png";
import BestMatchesImage from "../assets/images/BestMatches.png";
import SearchImage from "../assets/images/Search.png";
import AnalyticsImage from "../assets/images/Analytics.png";
import HeroSSImage from "../assets/images/HeroSS.png";

// Font Awesome Icons
import { faArrowRight, faArrowDown, faCheckCircle, faDatabase, faEnvelope, faRocket, faClock, faEnvelopeOpen, faQuestionCircle, faMagnifyingGlass, faChartBar, faChevronLeft, faChevronRight, faBolt, faDollarSign, faPlus, faRotateRight, faXmark, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Analytics
import { 
    trackPageView, 
    trackButtonClick, 
    trackContentInteraction, 
    trackUserJourney, 
    trackTimeOnPage
} from '../utils/analytics';
import { trackHomePageViewed } from '../utils/funnelTracking';

// Styles
import '../css/pages/Subscribe.css';

interface HomeProps {
    isSubscribed: boolean,
    email: string,
    sponsorCount: number,
    newsletterCount: number,
    lastUpdated: string,
    user?: User
}



const Home = ({ isSubscribed, email, newsletterCount, sponsorCount, lastUpdated, user }: HomeProps) => {
    const isNewsletterSubscribed = user?.newsletterOptIn === true;
    const [isMobile, setIsMobile] = useState(false);
    const [approvedCount, setApprovedCount] = useState<number>(150);
    
    // Provide fallback values if data is still loading
    const safeSponsorCount = sponsorCount || 0;
    const safeNewsletterCount = newsletterCount || 0;
    const safeLastUpdated = lastUpdated || new Date().toISOString();
    
    // Fetch approved sponsor count for pricing card
    useEffect(() => {
        let mounted = true;
        axios.get(`${config.backendUrl}sponsors/db-info`).then(res => {
            if (!mounted) return;
            setApprovedCount(res.data?.sponsors || 150);
        }).catch(() => setApprovedCount(150));
        return () => { mounted = false; };
    }, []);
    
    // Time tracking
    const pageLoadTime = useRef(Date.now());
    const [timeOnPage, setTimeOnPage] = useState(0);

    // Scroll tracking
    const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

    // Track page view and user journey
    useEffect(() => {
        const startTime = pageLoadTime.current;
        
        trackPageView('Home', 'Find Newsletter Sponsors Fast');
        trackUserJourney('home_page_view', 1, { 
            sponsorCount: safeSponsorCount, 
            newsletterCount: safeNewsletterCount, 
            isSubscribed: isSubscribed ? 'yes' : 'no' 
        });
        // Funnel tracking
        trackHomePageViewed();

        // Track time on page
        const interval = setInterval(() => {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            setTimeOnPage(timeSpent);
            
            // Track time on page every 30 seconds
            if (timeSpent % 30 === 0 && timeSpent > 0) {
                trackTimeOnPage('Home', timeSpent);
            }
        }, 1000);

        // Track scroll behavior and section visibility
        const handleScroll = () => {
            const sections = ['hero', 'pricing', 'faq'];
            const newVisibleSections = new Set<string>();
            
            sections.forEach(sectionId => {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    if (isVisible && !visibleSections.has(sectionId)) {
                        newVisibleSections.add(sectionId);
                        trackContentInteraction('section_view', sectionId, 'visible', 'home');
                    }
                }
            });
            
            if (newVisibleSections.size > 0) {
                setVisibleSections(prev => new Set([...Array.from(prev), ...Array.from(newVisibleSections)]));
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial visibility

        return () => {
            clearInterval(interval);
            window.removeEventListener('scroll', handleScroll);
            
            // Track final time on page when component unmounts
            const finalTime = Math.floor((Date.now() - startTime) / 1000);
            if (finalTime > 10) { // Only track if user spent more than 10 seconds
                trackTimeOnPage('Home', finalTime);
            }
        };
    }, [safeSponsorCount, safeNewsletterCount, isSubscribed, visibleSections]);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSignupClick = useCallback((location: string) => {
        trackButtonClick('signup_cta', 'home', { 
            location, 
            time_on_page: timeOnPage,
            sponsor_count: safeSponsorCount 
        });
        trackUserJourney('signup_click', 2, { location, time_on_page: timeOnPage });
    }, [timeOnPage, safeSponsorCount]);

    const handlePricingClick = useCallback(() => {
        trackButtonClick('pricing_cta', 'home', { 
            time_on_page: timeOnPage,
            sponsor_count: safeSponsorCount 
        });
        trackUserJourney('pricing_click', 3, { time_on_page: timeOnPage });
    }, [timeOnPage, safeSponsorCount]);

    // Commented out until we have a working demo video
    // const handleVideoInteraction = useCallback((action: string) => {
    //     trackContentInteraction('demo_video', 'youtube_demo', action, 'home');
    // }, []);

    const handleFeatureCardClick = (feature: string) => {
        trackContentInteraction('feature_card', feature, 'click', 'home');
    };


    return (
        <div className="web-page">
            {/* SECTION 1: HERO */}
            <div className="web-section web-section-dark mt-0 hero-new" id="hero">
                <div className="hero-new-container">
                    <div className="hero-new-grid">
                        {/* Left Column - Text */}
                        <div className="hero-new-text">
                            <h1 className="hero-new-title">
                                The Fastest Way to Find Newsletter Sponsors
                            </h1>
                            <p className="hero-new-subtitle">
                                Find and close newsletter sponsors in minutes, not months. 80+ verified sponsors with direct contact info, updated automatically every week.
                            </p>
                            
                            <div className="hero-new-cta">
                                <Link to="/signup" className="hero-new-primary-btn" onClick={() => handleSignupClick('hero')}>
                                    Start Free Trial
                                    <FontAwesomeIcon icon={faArrowRight} className="hero-btn-arrow" />
                                </Link>
                                <p className="hero-new-secondary-text">No sales calls. Start instantly.</p>
                            </div>
                        </div>
                        
                        {/* Right Column - Demo Placeholder */}
                        <div className="hero-new-demo">
                            <div className="hero-new-demo-placeholder">
                                <div className="hero-new-demo-content">
                                    <img 
                                        src={HeroSSImage} 
                                        alt="SponsorDB Dashboard" 
                                        className="hero-new-demo-image"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: PROBLEM STATEMENT */}
            <div className="web-section problem-statement-section" id="problem">
                <div className="web-section__container web-section-content">
                    <div className="problem-statement-container">
                        <p className="problem-statement-eyebrow">Sponsor outreach is broken</p>
                        <h2 className="problem-statement-title">Stop wasting hours on sponsor research</h2>
                        <p className="problem-statement-body">
                            Most newsletter creators still track sponsors by hand, scraping newsletters one by one, buying outdated lists, and guessing who to contact. It's slow, inaccurate, and frustrating. SponsorDB fixes that with an automatically growing database of verified sponsors with direct contact info.
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 3: WHAT YOU GET */}
            <div className="web-section what-you-get-section" id="what-you-get">
                <div className="web-section__container web-section-content">
                    <div className="what-you-get-container">
                        <p className="what-you-get-eyebrow">What you get</p>
                        <h2 className="what-you-get-title">The fastest-growing newsletter sponsor database</h2>
                        
                        {/* Stats */}
                        <div className="what-you-get-stats">
                            <div className="what-you-get-stat-card">
                                <div className="what-you-get-stat-number">80+</div>
                                <div className="what-you-get-stat-label">Verified Sponsors found in {safeNewsletterCount || 50}+ Newsletters</div>
                            </div>
                            <div className="what-you-get-stat-card">
                                <div className="what-you-get-stat-number">10+</div>
                                <div className="what-you-get-stat-label">New Sponsors Added Weekly</div>
                            </div>
                            <div className="what-you-get-stat-card">
                                <div className="what-you-get-stat-number">$800+</div>
                                <div className="what-you-get-stat-label">Revenue Tracked</div>
                            </div>
                        </div>

                        {/* Feature Tags */}
                        <div className="what-you-get-tags">
                            <div className="what-you-get-tag">
                                <FontAwesomeIcon icon={faCheckCircle} className="what-you-get-tag-icon" />
                                <span>Automatically growing database</span>
                            </div>
                            <div className="what-you-get-tag">
                                <FontAwesomeIcon icon={faCheckCircle} className="what-you-get-tag-icon" />
                                <span>Verified contact info</span>
                            </div>
                            <div className="what-you-get-tag">
                                <FontAwesomeIcon icon={faCheckCircle} className="what-you-get-tag-icon" />
                                <span>AI-powered matching</span>
                            </div>
                            <div className="what-you-get-tag">
                                <FontAwesomeIcon icon={faCheckCircle} className="what-you-get-tag-icon" />
                                <span>One-click outreach</span>
                            </div>
                            <div className="what-you-get-tag">
                                <FontAwesomeIcon icon={faCheckCircle} className="what-you-get-tag-icon" />
                                <span>Revenue tracking</span>
                            </div>
                            <div className="what-you-get-tag">
                                <FontAwesomeIcon icon={faCheckCircle} className="what-you-get-tag-icon" />
                                <span>Weekly updates</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENTLY ADDED SPONSORS CAROUSEL */}
            <RecentSponsorsCarousel />

            {/* SECTION 4: PROCESS */}
            <div className="web-section process-section" id="process">
                <div className="web-section__container web-section-content">
                    <div className="process-container">
                        <h2 className="process-title">From discover to outreach</h2>
                        <p className="process-subtitle">Your end-to-end sponsor workflow</p>

                        <div className="process-steps">
                            <div className="process-step-card">
                                <div className="process-step-header">
                                    <div className="process-step-number">1</div>
                                    <div className="process-step-icon">
                                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                                    </div>
                                </div>
                                <h3 className="process-step-title">Find sponsors in your niche</h3>
                                <p className="process-step-description">
                                    Browse 80+ verified sponsors or let AI match you with the best fits based on your newsletter topic and audience.
                                </p>
                            </div>

                            <div className="process-step-card">
                                <div className="process-step-header">
                                    <div className="process-step-number">2</div>
                                    <div className="process-step-icon">
                                        <FontAwesomeIcon icon={faBolt} />
                                    </div>
                                </div>
                                <h3 className="process-step-title">Send personalized pitches instantly</h3>
                                <p className="process-step-description">
                                    Generate pitch-ready emails in one click. We pre-fill everything based on the sponsor and your newsletter.
                                </p>
                            </div>

                            <div className="process-step-card">
                                <div className="process-step-header">
                                    <div className="process-step-number">3</div>
                                    <div className="process-step-icon">
                                        <FontAwesomeIcon icon={faDollarSign} />
                                    </div>
                                </div>
                                <h3 className="process-step-title">Track and close deals</h3>
                                <p className="process-step-description">
                                    Monitor every outreach, track response rates, and log revenue. Know exactly what's working.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 5: LARGE DEMO VIDEO SECTION */}
            <div className="web-section demo-large-section" id="demo">
                <div className="web-section__container web-section-content">
                    <div className="demo-large-container">
                        <p className="demo-large-eyebrow">See SponsorDB in action</p>
                        <h2 className="demo-large-title">Everything you need to land sponsors, in one place</h2>
                        
                        <div className="demo-large-video-wrapper">
                            <div className="demo-large-video-placeholder">
                                <div className="demo-large-video-content">
                                    <div className="demo-coming-soon">
                                        <p className="demo-coming-soon-text">Demo Video Coming Soon</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 6: FEATURE CARDS */}
            <div className="web-section feature-cards-section" id="features">
                <div className="web-section__container web-section-content">
                    <div className="feature-cards-container">
                        <h2 className="feature-cards-title">Built for newsletter creators who want to move fast</h2>
                        <p className="feature-cards-subtitle">SponsorDB replaces spreadsheets and guesswork with verified sponsor data.</p>

                        <div className="feature-cards-grid">
                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faDatabase} />
                                </div>
                                <h3 className="feature-card-title">Verified Sponsor Database</h3>
                                <p className="feature-card-description">
                                    80+ sponsors with direct contact info. No generic forms, no dead ends. Every email verified by our team.
                                </p>
                            </div>

                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faRotateRight} />
                                </div>
                                <h3 className="feature-card-title">Database Grows Itself</h3>
                                <p className="feature-card-description">
                                    AI adds new sponsors weekly. Zero effort from you. Your subscription gets more valuable every month, not less.
                                </p>
                            </div>

                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faRocket} />
                                </div>
                                <h3 className="feature-card-title">AI-Powered Matching</h3>
                                <p className="feature-card-description">
                                    Our AI analyzes your newsletter and suggests sponsors most likely to say yes based on niche and audience size.
                                </p>
                            </div>

                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faBolt} />
                                </div>
                                <h3 className="feature-card-title">One-Click Outreach</h3>
                                <p className="feature-card-description">
                                    Generate personalized pitch emails instantly. We pre-fill everything for you based on sponsor and your content.
                                </p>
                            </div>

                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faChartBar} />
                                </div>
                                <h3 className="feature-card-title">Revenue Tracking</h3>
                                <p className="feature-card-description">
                                    Track applications, responses, and earnings. Know your ROI at a glance with built-in analytics.
                                </p>
                            </div>

                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faClock} />
                                </div>
                                <h3 className="feature-card-title">Weekly Updates</h3>
                                <p className="feature-card-description">
                                    New sponsors added automatically every week. Get access to fresh opportunities before your competition.
                                </p>
                            </div>

                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                </div>
                                <h3 className="feature-card-title">No Middlemen</h3>
                                <p className="feature-card-description">
                                    You own every relationship. No revenue sharing, no commission structures, no agencies taking a cut.
                                </p>
                            </div>

                            <div className="feature-card-dark">
                                <div className="feature-card-icon">
                                    <FontAwesomeIcon icon={faRocket} />
                                </div>
                                <h3 className="feature-card-title">Self-Service</h3>
                                <p className="feature-card-description">
                                    Sign up instantly for $20/month. No lengthy sales calls, no demos, no waiting. Start pitching today.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 7: PRICING */}
            <div className="web-section pricing-new-section" id="pricing">
                <div className="web-section__container web-section-content">
                    <div className="subscribe-container">
                        <div className="subscribe-header">
                            <h1 className="subscribe-title">
                                Start your 14-day free trial
                            </h1>
                            <p className="subscribe-subtitle">
                                Get instant access to verified newsletter sponsors with proven track records. 
                                Find sponsors that actually respond and close deals faster.
                            </p>
                        </div>

                        <div className="subscribe-cards">
                            <div className="home__pricing-card home__pricing-card--featured">
                                <div className="home__pricing-card__trial-badge">2 Week Free Trial</div>
                                <div className="home__pricing-card__header">
                                    <h3 className="home__pricing-card__title">Sponsor Access</h3>
                                    <div className="home__pricing-card__price">
                                        <span className="home__pricing-card__currency">$</span>
                                        <span className="home__pricing-card__amount">20</span>
                                        <span className="home__pricing-card__period">/month</span>
                                    </div>
                                </div>
                                
                                <div className="home__pricing-card__benefits">
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Access to {approvedCount}+ verified sponsors</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Direct contact emails to decision makers at the sponsor company</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Sponsor search and filtering</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Pre-filled email templates</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Smart sponsor matching based on your newsletter</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Advanced filtering by industry & audience size</span>
                                    </div>
                                </div>
                                
                                <Link 
                                    className="home__pricing-card__cta-button home__pricing-card__cta-button--featured" 
                                    to="/signup"
                                    onClick={handlePricingClick}
                                >
                                    Start Free Trial
                                </Link>
                                <p className="home__pricing-card__trial-note">Card required • Cancel anytime</p>
                                {(() => {
                                    const trialEndDate = new Date();
                                    trialEndDate.setDate(trialEndDate.getDate() + 14);
                                    const formattedDate = trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                                    return <p className="trial-charge-note">Your card will be charged $20 on {formattedDate}</p>;
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 8: TRUST BANNER */}
            <div className="web-section trust-banner-section" id="trust">
                <div className="web-section__container web-section-content">
                    <div className="trust-banner-container">
                        <h2 className="trust-banner-title">Trusted by newsletter creators building profitable sponsorships</h2>
                        <p className="trust-banner-subtitle">
                            From solo creators to growing media brands, SponsorDB helps newsletter creators find and close sponsors faster than ever before.
                        </p>
                    </div>
                </div>
            </div>

            {/* SECTION 9: FAQ */}
            <div className="web-section web-section__container web-section-content" id="FAQ">
                <h2 className="web-section__container-header-sm">
                    Frequently Asked Questions
                </h2>
                <FAQAccordian />
            </div>
            <Link to="/signup" className="btn home__container-item__btn mb-5" onClick={() => handleSignupClick('bottom')}>
                Try Free for 14 Days&nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
            </Link>
        </div>
    );
};

export default memo(Home);


