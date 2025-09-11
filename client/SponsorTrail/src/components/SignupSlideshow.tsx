import { useState, useEffect } from 'react';
import { trackSlideshowInteraction } from '../utils/analytics';

interface SignupSlideshowProps {
    sponsorCount: number;
    newsletterCount: number;
}

const SignupSlideshow = ({ sponsorCount, newsletterCount }: SignupSlideshowProps) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-advance slides every 6 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    // Track slide changes
    useEffect(() => {
        const slideTitles = ['What is SponsorDB?', 'How It Works', 'Database Stats'];
        trackSlideshowInteraction(currentSlide + 1, 'auto_advance', slideTitles[currentSlide]);
    }, [currentSlide]);

    const nextSlide = () => {
        const slideTitles = ['What is SponsorDB?', 'How It Works', 'Database Stats'];
        trackSlideshowInteraction(currentSlide + 1, 'manual_next', slideTitles[currentSlide]);
        setCurrentSlide((prev) => (prev + 1) % 3);
    };

    const prevSlide = () => {
        const slideTitles = ['What is SponsorDB?', 'How It Works', 'Database Stats'];
        trackSlideshowInteraction(currentSlide + 1, 'manual_prev', slideTitles[currentSlide]);
        setCurrentSlide((prev) => (prev - 1 + 3) % 3);
    };

    const renderSlideContent = (slideIndex: number) => {
        switch (slideIndex) {
            case 0:
                return (
                    <div className="slide-content">
                        <h2 className="slide-title">What is SponsorDB?</h2>
                        <div className="slide-checklist">
                            <div className="checklist-item">
                                <span className="checklist-icon">✓</span>
                                <span className="checklist-text">{sponsorCount}+ active newsletter sponsors</span>
                            </div>
                            <div className="checklist-item">
                                <span className="checklist-icon">✓</span>
                                <span className="checklist-text">Direct application links</span>
                            </div>
                            <div className="checklist-item">
                                <span className="checklist-icon">✓</span>
                                <span className="checklist-text">Filter by niche & audience size</span>
                            </div>
                            <div className="checklist-item">
                                <span className="checklist-icon">✓</span>
                                <span className="checklist-text">Regular updates with new opportunities</span>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="slide-content">
                        <h2 className="slide-title">How It Works</h2>
                        <div className="slide-checklist">
                            <div className="checklist-item">
                                <span className="checklist-icon">1</span>
                                <span className="checklist-text">Browse sponsors by category</span>
                            </div>
                            <div className="checklist-item">
                                <span className="checklist-icon">2</span>
                                <span className="checklist-text">Filter by your newsletter size</span>
                            </div>
                            <div className="checklist-item">
                                <span className="checklist-icon">3</span>
                                <span className="checklist-text">Apply directly through our platform</span>
                            </div>
                            <div className="checklist-item">
                                <span className="checklist-icon">3</span>
                                <span className="checklist-text">
                                    Reduce your research time and get more sponsors.
                                </span>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="slide-content">
                        <h2 className="slide-title">Database Stats</h2>
                        <div className="slide-stats">
                            <div className="stat-item">
                                <div className="stat-number">{sponsorCount}+</div>
                                <div className="stat-label">Active Sponsors</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">{newsletterCount}+</div>
                                <div className="stat-label">Newsletters</div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="signup-slideshow">
            <div className="slideshow-container">
                <div className="slides-wrapper" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="slide">
                            {renderSlideContent(index)}
                        </div>
                    ))}
                </div>
                
                <button className="slideshow-nav prev" onClick={prevSlide} aria-label="Previous slide">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                
                <button className="slideshow-nav next" onClick={nextSlide} aria-label="Next slide">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

// TODO: Uncomment when real reviews are available
/*
Alternative case 1 for reviews:
case 1:
    return (
        <div className="slide-content">
            <h2 className="slide-title">Trusted by Newsletter Creators</h2>
            <div className="slide-reviews">
                <div className="review-item">
                    <span className="review-quote">"Found 3 sponsors in my first week"</span>
                    <span className="review-author">- Sarah K.</span>
                </div>
                <div className="review-item">
                    <span className="review-quote">"Saved hours of research"</span>
                    <span className="review-author">- Mike T.</span>
                </div>
                <div className="review-item">
                    <span className="review-quote">"Worth every penny"</span>
                    <span className="review-author">- Alex R.</span>
                </div>
            </div>
        </div>
    );
*/

export default SignupSlideshow; 