// React
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, memo, useCallback } from 'react';

// Components
import FAQAccordian from "../components/FAQAccordian";
import NewsletterSubscribe from "../components/NewsletterSubscribe";
import { User } from "../types/User";

// Font Awesome Icons
import { faArrowRight, faArrowDown, faCheckCircle, faDatabase, faEnvelope, faChartLine, faSearch, faTimes, faExclamationTriangle, faRocket, faClock, faEnvelopeOpen, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Analytics
import { 
    trackPageView, 
    trackButtonClick, 
    trackContentInteraction, 
    trackUserJourney, 
    trackTimeOnPage
} from '../utils/analytics';

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
    const [arrowPosition, setArrowPosition] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    
    // Provide fallback values if data is still loading
    const safeSponsorCount = sponsorCount || 0;
    const safeNewsletterCount = newsletterCount || 0;
    const safeLastUpdated = lastUpdated || new Date().toISOString();
    
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

            // Track arrow position for problems-solved section
            const problemsSection = document.getElementById('problems-solved');
            if (problemsSection) {
                const rect = problemsSection.getBoundingClientRect();
                const sectionHeight = problemsSection.offsetHeight;
                const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (sectionHeight + window.innerHeight)));
                setArrowPosition(scrollProgress * 100);
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
            <div className="web-section web-section-dark mt-0" id="hero">
                <div className="web-section__container web-section-content">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="web-section__container-header airtable-header text-center">
                                Access {safeSponsorCount}+ Verified Newsletter Sponsors
                            </h1>
                            <p className="hero-text-p">
                                Stop searching. We've compiled sponsors actively paying for newsletter placements, with direct contact information and pre-filled outreach templates.
                            </p>
                            <div className="hero-features mb-0">
                                <div className="hero-feature-card" onClick={() => handleFeatureCardClick('verified_sponsors')}>
                                    <FontAwesomeIcon icon={faDatabase} className="hero-feature-icon" />
                                    <p><span className="hero-feature-card__title">Verified sponsor database - </span>updated weekly</p>
                                </div>
                                <div className="hero-feature-card" onClick={() => handleFeatureCardClick('direct_contact')}>
                                    <FontAwesomeIcon icon={faEnvelope} className="hero-feature-icon" />
                                    <p><span className="hero-feature-card__title">Direct contact info - </span>email or application links</p>
                                </div>
                                <div className="hero-feature-card" onClick={() => handleFeatureCardClick('email_templates')}>
                                    <FontAwesomeIcon icon={faRocket} className="hero-feature-icon" />
                                    <p><span className="hero-feature-card__title">Pre-filled email templates - </span>based on your newsletter</p>
                                </div>
                            </div>
                            <div className="hero-buttons">
                                <Link to="/signup" className="btn home__container-item__btn mb-3" onClick={() => handleSignupClick('hero')}>
                                    Try Free for 14 Days &nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                                </Link>
                                <div className="hero-trust-container">
                                    <p className="hero-trust-text">Join newsletter creators already earning with SponsorDB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Problem-Solving Section */}
            <div className="web-section web-section-dark" id="problems-solved">
                <div className="web-section__container web-section-content">
                    <div className="problems-solved-container">
                        <div className="problems-solved-header">
                            <h2 className="problems-solved-title">
                                Stop Losing Money on Failed Sponsor Outreach
                            </h2>
                            <p className="problems-solved-subtitle">
                                Most newsletter creators waste time on sponsors that never respond. We help you find sponsors that actually convert.
                            </p>
                        </div>

                        {/* Image Showcase */}
                        <div className="problems-solved-showcase">
                            <div className="problems-solved-image-container">
                                <div className="problems-solved-image-placeholder problems-solved-image--database">
                                    <div className="problems-solved-image-overlay">
                                        <FontAwesomeIcon icon={faClock} />
                                        <span>Time Wasted</span>
                                    </div>
                                </div>
                                <div className="problems-solved-image-placeholder problems-solved-image--application">
                                    <div className="problems-solved-image-overlay">
                                        <FontAwesomeIcon icon={faEnvelopeOpen} />
                                        <span>Failed Emails</span>
                                    </div>
                                </div>
                                <div className="problems-solved-image-placeholder problems-solved-image--developer">
                                    <div className="problems-solved-image-overlay">
                                        <FontAwesomeIcon icon={faQuestionCircle} />
                                        <span>No Tracking</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="problems-solved-comparison">
                            <div className="problems-solved-column problems-solved-column--old">
                                <h3 className="problems-solved-column-title">Why Most Outreach Fails</h3>
                                <div className="problems-solved-items">
                                    <div className="problems-solved-item">
                                        <div className="problems-solved-icon problems-solved-icon--old">
                                            <FontAwesomeIcon icon={faSearch} />
                                        </div>
                                        <div className="problems-solved-content">
                                            <h4>Wasting time on sponsors who never respond</h4>
                                            <p>Pitching random sponsors without knowing their response rates or audience fit</p>
                                        </div>
                                    </div>
                                    <div className="problems-solved-item">
                                        <div className="problems-solved-icon problems-solved-icon--old">
                                            <FontAwesomeIcon icon={faTimes} />
                                        </div>
                                        <div className="problems-solved-content">
                                            <h4>Generic emails that get ignored</h4>
                                            <p>Generic emails that get ignored, wasting hours of your time</p>
                                        </div>
                                    </div>
                                    <div className="problems-solved-item">
                                        <div className="problems-solved-icon problems-solved-icon--old">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                        </div>
                                        <div className="problems-solved-content">
                                            <h4>No idea what's actually working</h4>
                                            <p>No idea which sponsors convert or how much revenue you're actually generating</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="problems-solved-divider">
                                <div 
                                    className="problems-solved-arrow problems-solved-arrow--animated"
                                    style={{ transform: `translateY(${arrowPosition}px)` }}
                                >
                                    <FontAwesomeIcon icon={isMobile ? faArrowDown : faArrowRight} />
                                </div>
                            </div>

                            <div className="problems-solved-column problems-solved-column--new">
                                <h3 className="problems-solved-column-title">How We Fix It</h3>
                                <div className="problems-solved-items">
                                    <div className="problems-solved-item">
                                        <div className="problems-solved-icon problems-solved-icon--new">
                                            <FontAwesomeIcon icon={faRocket} />
                                        </div>
                                        <div className="problems-solved-content">
                                            <h4>Only pitch sponsors who want your audience</h4>
                                            <p>Get matched with sponsors that match your audience demographics and have proven response rates</p>
                                        </div>
                                    </div>
                                    <div className="problems-solved-item">
                                        <div className="problems-solved-icon problems-solved-icon--new">
                                            <FontAwesomeIcon icon={faEnvelope} />
                                        </div>
                                        <div className="problems-solved-content">
                                            <h4>Email templates that actually get responses</h4>
                                            <p>Email templates that actually get responses, tested by successful newsletter creators</p>
                                        </div>
                                    </div>
                                    <div className="problems-solved-item">
                                        <div className="problems-solved-icon problems-solved-icon--new">
                                            <FontAwesomeIcon icon={faChartLine} />
                                        </div>
                                        <div className="problems-solved-content">
                                            <h4>Track what works and optimize your earnings</h4>
                                            <p>Track your revenue vs time spent to optimize your outreach strategy and maximize earnings</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section - Commented out until we have real reviews */}
            {/* 
            <div className="web-section web-section-dark" id="testimonials">
                <div className="web-section__container web-section-content">
                    <div className="testimonials-container">
                        <div className="testimonials-header">
                            <h2 className="testimonials-title">
                                Trusted by Newsletter Creators
                            </h2>
                            <p className="testimonials-subtitle">
                                See how other creators are using SponsorTrail to grow their revenue
                            </p>
                        </div>
                        
                        <div className="testimonials-grid">
                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        "SponsorTrail completely transformed my newsletter monetization. I went from struggling to find sponsors to closing deals within weeks. The AI matching is incredibly accurate."
                                    </div>
                                    <div className="testimonial-author">
                                        <div className="testimonial-author-info">
                                            <div className="testimonial-author-name">Sarah Chen</div>
                                            <div className="testimonial-author-title">Tech Newsletter Creator</div>
                                            <div className="testimonial-author-revenue">$2,400/month revenue</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        "The response rate analytics alone paid for the subscription. I can see exactly which sponsors respond to creators like me, saving me hours of wasted outreach."
                                    </div>
                                    <div className="testimonial-author">
                                        <div className="testimonial-author-info">
                                            <div className="testimonial-author-name">Marcus Rodriguez</div>
                                            <div className="testimonial-author-title">Marketing Newsletter</div>
                                            <div className="testimonial-author-revenue">$1,800/month revenue</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        "I was skeptical about another tool, but SponsorTrail's templates actually work. My response rate went from 5% to 35% in the first month."
                                    </div>
                                    <div className="testimonial-author">
                                        <div className="testimonial-author-info">
                                            <div className="testimonial-author-name">Emily Watson</div>
                                            <div className="testimonial-author-title">Productivity Newsletter</div>
                                            <div className="testimonial-author-revenue">$3,200/month revenue</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        "The ROI tracking feature is a game-changer. I can see exactly how much time I'm spending vs revenue generated. It's helped me optimize my entire process."
                                    </div>
                                    <div className="testimonial-author">
                                        <div className="testimonial-author-info">
                                            <div className="testimonial-author-name">David Kim</div>
                                            <div className="testimonial-author-title">Business Newsletter</div>
                                            <div className="testimonial-author-revenue">$4,100/month revenue</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        "Finally, a platform that understands the newsletter creator's needs. The sponsor verification process gives me confidence in every outreach."
                                    </div>
                                    <div className="testimonial-author">
                                        <div className="testimonial-author-info">
                                            <div className="testimonial-author-name">Lisa Thompson</div>
                                            <div className="testimonial-author-title">Finance Newsletter</div>
                                            <div className="testimonial-author-revenue">$2,700/month revenue</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="testimonial-card">
                                <div className="testimonial-content">
                                    <div className="testimonial-quote">
                                        "The AI assistant for outreach optimization is incredible. It suggests improvements to my emails that I never would have thought of."
                                    </div>
                                    <div className="testimonial-author">
                                        <div className="testimonial-author-info">
                                            <div className="testimonial-author-name">Alex Johnson</div>
                                            <div className="testimonial-author-title">Design Newsletter</div>
                                            <div className="testimonial-author-revenue">$1,900/month revenue</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="testimonials-cta">
                            <p className="testimonials-cta-text">Ready to join these successful creators?</p>
                            <Link to="/signup" className="btn home__container-item__btn" onClick={() => handleSignupClick('testimonials')}>
                                Start Your Success Story &nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            */}

            {/* Demo Video Section - Commented out until we have a working video */}
            {/* 
            <div className="web-section web-section-dark" id="demo">
                <div className="web-section__container web-section-content">
                    <div className="demo-container">
                        <div className="demo-header">
                            <h2 className="demo-title">
                                See SponsorDB in Action
                            </h2>
                            <p className="demo-subtitle">
                                Watch how easy it is to find and connect with sponsors using our platform
                            </p>
                        </div>
                        
                        <div className="demo-video-container">
                            <div className="demo-video-wrapper">
                                <iframe 
                                    className="demo-video"
                                    src="https://www.youtube.com/embed/your-demo-video-id"
                                    title="SponsorTrail Demo Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>


                        <div className="demo-cta">
                            <Link to="/signup" className="btn home__container-item__btn" onClick={() => handleSignupClick('demo')}>
                                Start Your Free Trial &nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            */}
            <div className="web-section web-section-dark subscribe" id="pricing">
                <div className="web-section__container web-section-content">
                    <div className="home__pricing-container">
                        <div className="home__pricing-header">
                            <h2 className="home__pricing-title">Simple, Clear Pricing</h2>
                            <p className="home__pricing-subtitle">One plan. Everything you need to find and connect with sponsors.</p>
                        </div>
                        <div className="home__pricing-cards">
                            <div className="home__pricing-card home__pricing-card--featured">
                                <div className="home__pricing-card__header">
                                    <h3 className="home__pricing-card__title">SponsorDB Access</h3>
                                    <div className="home__pricing-card__price">
                                        <span className="home__pricing-card__currency">$</span>
                                        <span className="home__pricing-card__amount">20</span>
                                        <span className="home__pricing-card__period">/month</span>
                                    </div>
                                </div>
                                
                                <div className="home__pricing-card__benefits">
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Access to full sponsor database</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Weekly updates with new sponsors</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Pre-filled email templates</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Contact info for all sponsors</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Cancel anytime</span>
                                    </div>
                                </div>
                                
                                <Link className="home__pricing-card__cta-button home__pricing-card__cta-button--featured" to="/signup" onClick={handlePricingClick}>
                                    Start Free Trial
                                </Link>
                                <p className="home__pricing-card__trial-note">Card required • Cancel anytime</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="web-section web-section__container web-section-content" id="FAQ">
                <h2 className="web-section__container-header-sm">
                    Frequently Asked Questions
                </h2>
                <FAQAccordian />
            </div>
            <Link to="/signup" className="btn home__container-item__btn mb-5" onClick={() => handleSignupClick('bottom')}>
                Try Free for 14 Days&nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
            </Link>

            {/* Newsletter Subscribe Section */}
            <div id="newsletter">
                <NewsletterSubscribe isSubscribed={isNewsletterSubscribed} />
            </div>
        </div>
    );
};

export default memo(Home);