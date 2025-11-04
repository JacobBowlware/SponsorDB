import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEnvelope, 
    faCalendarAlt, 
    faUsers,
    faCheckCircle,
    faSpinner,
    faTag,
    faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import NewsletterSubscribe from '../components/NewsletterSubscribe';
import { User } from '../types/User';
import '../css/pages/NewsletterPage.css';

interface NewsletterPageProps {
    user: User;
    userAuth: boolean;
}

interface Newsletter {
    _id: string;
    subject: string;
    sentAt: string;
    recipientCount: number;
    sponsors: Array<{
        _id: string;
        sponsorName: string;
        sponsorLink?: string;
        tags?: string[];
        sponsorEmail?: string;
        sponsorApplication?: string;
    }>;
}

const NewsletterPage = ({ user, userAuth }: NewsletterPageProps) => {
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Check if user is already subscribed
    const isSubscribed = userAuth && user?.newsletterOptIn === true;

    useEffect(() => {
        fetchNewsletters();
    }, []);

    const fetchNewsletters = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${config.backendUrl}users/newsletter/list`);
            
            if (response.data.success) {
                setNewsletters(response.data.newsletters || []);
            } else {
                setError('Failed to load newsletters');
            }
        } catch (err: any) {
            console.error('Error fetching newsletters:', err);
            setError('Failed to load newsletters. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="newsletter-page">
            {/* Hero Section with Subscribe Form */}
            <div className="newsletter-hero">
                <div className="newsletter-hero__content">
                    <div className="newsletter-hero__icon">
                        <FontAwesomeIcon icon={faEnvelope} />
                    </div>
                    <h1 className="newsletter-hero__title">SponsorDB Newsletter</h1>
                    <p className="newsletter-hero__description">
                        Get weekly updates with verified newsletter sponsors delivered straight to your inbox. 
                        Join newsletter creators who stay ahead of the game.
                    </p>
                    
                    {/* Subscribe Form */}
                    <div className="newsletter-hero__subscribe">
                        <NewsletterSubscribe isSubscribed={isSubscribed} />
                    </div>
                </div>
            </div>

            {/* Newsletter Archive */}
            <div className="newsletter-content">
                <div className="newsletter-content__header">
                    <h2 className="newsletter-content__title">Previous Editions</h2>
                    <p className="newsletter-content__subtitle">
                        Browse our past newsletters to see what kind of sponsors we feature
                    </p>
                </div>

                {loading && (
                    <div className="newsletter-loading">
                        <FontAwesomeIcon icon={faSpinner} spin />
                        <span>Loading newsletters...</span>
                    </div>
                )}

                {error && (
                    <div className="newsletter-error">
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && newsletters.length === 0 && (
                    <div className="newsletter-empty">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <p>No newsletters have been sent yet. Check back soon!</p>
                    </div>
                )}

                {!loading && !error && newsletters.length > 0 && (
                    <div className="newsletter-grid">
                        {newsletters.map((newsletter) => (
                            <div key={newsletter._id} className="newsletter-card">
                                <div className="newsletter-card__header">
                                    <h3 className="newsletter-card__title">{newsletter.subject}</h3>
                                    <div className="newsletter-card__meta">
                                        <div className="newsletter-card__meta-item">
                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                            <span>{formatDate(newsletter.sentAt)}</span>
                                        </div>
                                        <div className="newsletter-card__meta-item">
                                            <FontAwesomeIcon icon={faUsers} />
                                            <span>{newsletter.recipientCount} recipients</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="newsletter-card__sponsors">
                                    <h4 className="newsletter-card__sponsors-title">
                                        Featured Sponsors ({newsletter.sponsors.length})
                                    </h4>
                                    <div className="newsletter-card__sponsors-list">
                                        {newsletter.sponsors.map((sponsor, index) => (
                                            <div key={sponsor._id || index} className="newsletter-sponsor-item">
                                                <div className="newsletter-sponsor-item__name">
                                                    {sponsor.sponsorName}
                                                </div>
                                                {sponsor.tags && sponsor.tags.length > 0 && (
                                                    <div className="newsletter-sponsor-item__tags">
                                                        {sponsor.tags.slice(0, 3).map((tag, tagIndex) => (
                                                            <span key={tagIndex} className="newsletter-tag">
                                                                <FontAwesomeIcon icon={faTag} />
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {sponsor.sponsorLink && (
                                                    <a 
                                                        href={sponsor.sponsorLink} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="newsletter-sponsor-item__link"
                                                    >
                                                        View Sponsor
                                                        <FontAwesomeIcon icon={faArrowRight} />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsletterPage;

