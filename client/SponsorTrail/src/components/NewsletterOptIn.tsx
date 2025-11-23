import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faCheckCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import tokenManager from '../utils/tokenManager';
import '../css/NewsletterOptIn.css';

interface NewsletterOptInProps {
    onOptIn: (optedIn: boolean) => void;
    onSkip: () => void;
}

const NewsletterOptIn: React.FC<NewsletterOptInProps> = ({ onOptIn, onSkip }) => {
    const [optedIn, setOptedIn] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const accessToken = await tokenManager.getValidAccessToken();
            if (!accessToken) {
                onSkip();
                return;
            }

            // Update user's newsletter opt-in status
            await axios.put(
                `${config.backendUrl}users/me`,
                { newsletterOptIn: optedIn },
                {
                    headers: {
                        'x-auth-token': accessToken
                    }
                }
            );

            onOptIn(optedIn);
        } catch (error) {
            console.error('Error updating newsletter opt-in:', error);
            // Continue anyway
            onOptIn(optedIn);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="newsletter-opt-in-container">
            {/* Mobile simplified view */}
            <div className="newsletter-opt-in-mobile-simple">
                <p className="newsletter-opt-in-mobile-text">
                    Get the latest verified sponsors delivered to your inbox weekly. Free. Unsubscribe anytime.
                </p>
                <button
                    className="newsletter-opt-in-continue"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : 'Continue'}
                    {!isSubmitting && <FontAwesomeIcon icon={faArrowRight} />}
                </button>
            </div>
            
            {/* Desktop full view */}
            <div className="newsletter-opt-in-card">
                <div className="newsletter-opt-in-header">
                    <FontAwesomeIcon icon={faEnvelope} className="newsletter-opt-in-icon" />
                    <h2>Stay Updated with SponsorDB</h2>
                    <p>Send me weekly sponsor updates</p>
                </div>
                
                <div className="newsletter-opt-in-options">
                    <label className={`newsletter-opt-in-option ${optedIn ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="optIn"
                            checked={optedIn}
                            onChange={() => setOptedIn(true)}
                        />
                        <div className="option-content">
                            <FontAwesomeIcon icon={faCheckCircle} className="option-icon" />
                            <div>
                                <strong>Yes, subscribe me</strong>
                                <span>Receive weekly updates about new sponsors</span>
                            </div>
                        </div>
                    </label>
                    
                    <label className={`newsletter-opt-in-option ${!optedIn ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="optIn"
                            checked={!optedIn}
                            onChange={() => setOptedIn(false)}
                        />
                        <div className="option-content">
                            <div className="option-icon-placeholder"></div>
                            <div>
                                <strong>No thanks</strong>
                                <span>Skip newsletter subscription</span>
                            </div>
                        </div>
                    </label>
                </div>

                <div className="newsletter-opt-in-actions">
                    <button
                        className="newsletter-opt-in-continue"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Continue'}
                        {!isSubmitting && <FontAwesomeIcon icon={faArrowRight} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewsletterOptIn;

