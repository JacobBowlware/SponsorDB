import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faCheckCircle, faSpinner, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';

interface NewsletterSubscribeProps {
    isSubscribed?: boolean;
}

const NewsletterSubscribe = ({ isSubscribed = false }: NewsletterSubscribeProps) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        setStatus('idle');
        setMessage('');

        try {
            const response = await axios.post(`${config.backendUrl}users/newsletter/subscribe`, {
                email: email
            });

            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.message || 'Successfully subscribed! Check your email.');
                setEmail('');
            } else {
                setStatus('error');
                setMessage(response.data.error || 'Failed to subscribe. Please try again.');
            }
        } catch (error: any) {
            console.error('Error subscribing to newsletter:', error);
            setStatus('error');
            setMessage(error.response?.data?.error || 'Failed to subscribe. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubscribed) {
        return (
            <div className="newsletter-subscribe-section">
                <div className="newsletter-subscribe-container">
                    <div className="newsletter-subscribe-content newsletter-subscribe-content--subscribed">
                        <FontAwesomeIcon icon={faCheckCircle} className="newsletter-subscribe-icon newsletter-subscribe-icon--subscribed" />
                        <h3 className="newsletter-subscribe-title">You're Subscribed!</h3>
                        <p className="newsletter-subscribe-description">
                            You're already receiving our weekly newsletter with verified sponsors.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="newsletter-subscribe-section">
            <div className="newsletter-subscribe-container">
                <div className="newsletter-subscribe-content">
                    <FontAwesomeIcon icon={faEnvelope} className="newsletter-subscribe-icon" />
                    <h3 className="newsletter-subscribe-title">Get Weekly Sponsor Updates</h3>
                    <p className="newsletter-subscribe-description">
                        Join our newsletter and get the latest verified sponsors delivered to your inbox every week.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="newsletter-subscribe-form">
                        <div className="newsletter-input-group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="newsletter-subscribe-input"
                                disabled={isSubmitting || status === 'success'}
                                required
                            />
                            <button
                                type="submit"
                                className="newsletter-subscribe-button"
                                disabled={isSubmitting || status === 'success'}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        Subscribing...
                                    </>
                                ) : status === 'success' ? (
                                    <>
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        Subscribed!
                                    </>
                                ) : (
                                    'Subscribe'
                                )}
                            </button>
                        </div>
                        
                        {message && (
                            <div className={`newsletter-subscribe-message ${status}`}>
                                {message}
                            </div>
                        )}
                    </form>
                    
                    <p className="newsletter-subscribe-note">
                        No spam. Unsubscribe anytime.
                    </p>
                    
                    <Link to="/newsletter/" className="newsletter-subscribe-past-link">
                        See our previous editions
                        <FontAwesomeIcon icon={faArrowRight} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NewsletterSubscribe;

