import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faChevronLeft, faChevronRight, faLock } from '@fortawesome/free-solid-svg-icons';
import '../css/components/RecentSponsorsCarousel.css';

interface NewsletterSponsored {
    newsletterName: string;
    estimatedAudience?: number;
    contentTags?: string[];
    dateSponsored?: string | Date;
    emailAddress?: string;
}

interface Sponsor {
    _id?: string;
    sponsorName: string;
    sponsorEmail?: string;
    businessContact?: string;
    contactPersonName?: string;
    contactPersonTitle?: string;
    contactType?: string;
    newslettersSponsored?: NewsletterSponsored[];
    totalPlacements?: number;
    avgAudienceSize?: number;
    mostRecentNewsletterDate?: string | Date;
    contactMethod?: 'email' | 'none';
    status?: 'pending' | 'approved';
}

interface RecentSponsorsCarouselProps {
    sponsors?: Sponsor[];
}

// Real sponsor data from database - UPDATED with high-value contacts
const defaultSponsors: Sponsor[] = [
    {
        sponsorName: "BLAND",
        sponsorEmail: "josh@bland.ai",
        contactPersonName: "Josh Lipton",
        contactPersonTitle: "Head of Growth & Marketing",
        contactMethod: "email",
        contactType: "named_person",
        status: "approved",
        totalPlacements: 1,
        avgAudienceSize: 1999998,
        newslettersSponsored: [
            { newsletterName: "The Rundown AI", estimatedAudience: 1999998, dateSponsored: "2025-11-17", contentTags: ["AI", "Software", "Business"] }
        ]
    },
    {
        sponsorName: "nothing.tech",
        sponsorEmail: "ryan.li@nothing.tech",
        contactPersonName: "Ryan Li",
        contactPersonTitle: "Global Head of Marketing",
        contactMethod: "email",
        contactType: "named_person",
        status: "approved",
        totalPlacements: 1,
        avgAudienceSize: 1000000,
        newslettersSponsored: [
            { newsletterName: "Superhuman", estimatedAudience: 1000000, dateSponsored: "2025-11-16", contentTags: ["Technology", "Retail", "Ecommerce"] }
        ]
    },
    {
        sponsorName: "Onyx",
        sponsorEmail: "benjamin.charbit@onyx.app",
        contactPersonName: "Benjamin Charbit",
        contactPersonTitle: "Co-founder & CEO",
        contactMethod: "email",
        contactType: "named_person",
        status: "approved",
        totalPlacements: 1,
        avgAudienceSize: 110000,
        newslettersSponsored: [
            { newsletterName: "Neat Prompts", estimatedAudience: 110000, dateSponsored: "2025-11-11", contentTags: ["AI", "Software", "Education"] }
        ]
    },
    {
        sponsorName: "PlayCanvas",
        sponsorEmail: "maksym.veremchuk@playcanvas.com",
        contactPersonName: "Maksym Veremchuk",
        contactPersonTitle: "Marketing Manager",
        contactMethod: "email",
        contactType: "named_person",
        status: "approved",
        totalPlacements: 1,
        avgAudienceSize: 70000,
        newslettersSponsored: [
            { newsletterName: "The Neuron Daily", estimatedAudience: 70000, dateSponsored: "2025-11-17", contentTags: ["Technology", "Software", "Entertainment"] }
        ]
    },
    {
        sponsorName: "AARP",
        sponsorEmail: "fadden@aarp.org",
        contactPersonName: "Amy Fadden",
        contactPersonTitle: "Senior Director, Marketing Solutions",
        contactMethod: "email",
        contactType: "named_person",
        status: "approved",
        totalPlacements: 1,
        avgAudienceSize: 25000,
        newslettersSponsored: [
            { newsletterName: "Naptown Scoop", estimatedAudience: 25000, dateSponsored: "2025-11-18", contentTags: ["Business", "Marketing", "Ecommerce"] }
        ]
    }
];

const RecentSponsorsCarousel: React.FC<RecentSponsorsCarouselProps> = ({ sponsors = defaultSponsors }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Determine cards per view based on screen size
    const getCardsPerView = () => {
        if (windowWidth < 768) return 1; // Mobile
        if (windowWidth < 1240) return 2; // Medium screens - 2 cards for better spacing
        return 3; // Desktop - 3 cards
    };
    
    const cardsPerView = getCardsPerView();
    // For sliding one card at a time, we need more slides
    const totalSlides = sponsors.length;

    // Blur email function
    const blurEmail = (email: string): string => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) return email;
        if (localPart.length <= 3) {
            return `${localPart[0]}***@${domain}`;
        }
        const visibleStart = localPart.substring(0, 3);
        return `${visibleStart}***@${domain}`;
    };

    // Format date
    const formatDate = (date: string | Date | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Format audience size
    const formatAudience = (size: number | undefined): string => {
        if (!size) return '';
        if (size >= 1000000) return `${(size / 1000000).toFixed(1)}M`;
        if (size >= 1000) return `${(size / 1000).toFixed(1)}K`;
        return size.toString();
    };

    // Auto-rotate carousel - only forward (right to left)
    useEffect(() => {
        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
            }, 5000); // Slower: 5 seconds instead of 4
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPaused, totalSlides]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    };

    return (
        <div className="recent-sponsors-section" id="recent-sponsors">
            <div className="recent-sponsors-header">
                <h2 className="recent-sponsors-title">Recently Added to SponsorDB</h2>
                <p className="recent-sponsors-subtitle">Fresh sponsors added this week. Join to see full contact details.</p>
            </div>

            <div 
                className="recent-sponsors-carousel"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <button 
                    className="carousel-nav-btn carousel-nav-prev"
                    onClick={goToPrevious}
                    aria-label="Previous sponsors"
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div className="carousel-container">
                    <div 
                        className="carousel-track"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
                            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            '--cards-per-view': cardsPerView
                        } as React.CSSProperties}
                    >
                        {/* Render slides - each slide contains cardsPerView number of cards */}
                        {Array.from({ length: sponsors.length + cardsPerView - 1 }).map((_, slideIndex) => {
                            const startIndex = slideIndex;
                            const slideSponsors = [];
                            
                            // Get sponsors for this slide, wrapping around if needed
                            for (let i = 0; i < cardsPerView; i++) {
                                const sponsorIndex = (startIndex + i) % sponsors.length;
                                slideSponsors.push(sponsors[sponsorIndex]);
                            }
                            
                            return (
                                <div key={slideIndex} className="carousel-slide" style={{ '--cards-per-view': cardsPerView } as React.CSSProperties}>
                                    {slideSponsors.map((sponsorCard, cardIdx) => {
                                        const contactEmail = sponsorCard.sponsorEmail || sponsorCard.businessContact || '';
                                        const newsletters = sponsorCard.newslettersSponsored || [];
                                        
                                        return (
                                            <div key={`${slideIndex}-${cardIdx}`} className="sponsor-card">
                                                {/* Newsletter First - Primary Focus */}
                                                {newsletters.length > 0 && (
                                                    <div className="sponsor-newsletter-header">
                                                        <div className="sponsor-newsletter-name">{newsletters[0].newsletterName}</div>
                                                        {newsletters[0].estimatedAudience && (
                                                            <div className="sponsor-newsletter-audience">
                                                                {formatAudience(newsletters[0].estimatedAudience)} subscribers
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {/* Relationship Indicator */}
                                                <div className="sponsor-relationship">
                                                    <span className="sponsor-relationship-label">Sponsored by</span>
                                                    <span className="sponsor-company-name">{sponsorCard.sponsorName}</span>
                                                </div>
                                                
                                                {/* Contact Person - THE KEY VALUE PROP */}
                                                {sponsorCard.contactPersonName && (
                                                    <div className="sponsor-contact-person">
                                                        <div className="sponsor-contact-person-name">{sponsorCard.contactPersonName}</div>
                                                        {sponsorCard.contactPersonTitle && (
                                                            <div className="sponsor-contact-person-title">{sponsorCard.contactPersonTitle}</div>
                                                        )}
                                                        <div className="sponsor-email-container mt-2">
                                                            <FontAwesomeIcon icon={faLock} className="sponsor-email-lock" />
                                                            <span className="sponsor-email">{blurEmail(contactEmail)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                
                                                {/* Tags */}
                                                {newsletters.length > 0 && (() => {
                                                    // Collect all unique content tags from newsletters
                                                    const allTags = new Set<string>();
                                                    newsletters.forEach(newsletter => {
                                                        if (newsletter.contentTags && newsletter.contentTags.length > 0) {
                                                            newsletter.contentTags.forEach(tag => allTags.add(tag));
                                                        }
                                                    });
                                                    const uniqueTags = Array.from(allTags).slice(0, 3); // Show up to 3 tags
                                                    
                                                    return uniqueTags.length > 0 ? (
                                                        <div className="sponsor-tags">
                                                            {uniqueTags.map((tag, idx) => (
                                                                <span key={idx} className="sponsor-tag">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button 
                    className="carousel-nav-btn carousel-nav-next"
                    onClick={goToNext}
                    aria-label="Next sponsors"
                >
                    <FontAwesomeIcon icon={faChevronRight} />
                </button>
            </div>

            <div className="carousel-dots">
                {Array.from({ length: sponsors.length }).map((_, index) => (
                    <button
                        key={index}
                        className={`carousel-dot ${index === (currentIndex % sponsors.length) ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecentSponsorsCarousel;

