import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCrown, faStar, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { trackPageView, trackButtonClick, trackUserJourney } from '../utils/analytics';
import config from '../config';
import axios from 'axios';

interface SubscribeProps {
    userAuth: boolean;
    isSubscribed: boolean;
    subscription?: string;
}

const Subscribe = ({ userAuth, isSubscribed, subscription }: SubscribeProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Track page view
    useEffect(() => {
        trackPageView('Subscribe', 'Choose Your Subscription Plan');
        trackUserJourney('subscribe_page_view', 1, { 
            userAuth: userAuth ? 'yes' : 'no',
            isSubscribed: isSubscribed ? 'yes' : 'no'
        });
    }, [userAuth, isSubscribed]);

    // Redirect if user is already subscribed
    useEffect(() => {
        if (userAuth && isSubscribed && subscription && subscription !== 'none') {
            navigate('/sponsors');
        }
    }, [userAuth, isSubscribed, subscription, navigate]);

    const handlePlanSelect = async (plan: string) => {
        setLoading(true);
        setError('');

        try {
            trackButtonClick('plan_select', 'subscribe', { plan });
            trackUserJourney('plan_selected', 2, { plan });

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signup');
                return;
            }

            const response = await axios.post(`${config.backendUrl}users/checkout`, {
                plan: plan
            }, {
                headers: {
                    'x-auth-token': token
                }
            });

            // Redirect to Stripe checkout
            const stripe = await import('@stripe/stripe-js');
            const stripePromise = stripe.loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_live_51MpGntBKPgChhmNg9wLgFqQICAjXSVAzaEMRKwXjuLQeZZhwghaiA7VDoG0Cov9uEnDGF9RlAKQkQ1xXPSooAX8D00Mp9uCFyO");
            const stripeInstance = await stripePromise;

            await stripeInstance?.redirectToCheckout({
                sessionId: response.data.sessionId
            });

        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            setError(error.response?.data || 'Error creating checkout session. Please try again.');
            trackUserJourney('checkout_error', 3, { plan, error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSignupClick = () => {
        trackButtonClick('signup_redirect', 'subscribe');
        navigate('/signup');
    };

    return (
        <div className="web-page">
            <div className="web-section web-section-dark mt-0" id="subscribe">
                <div className="web-section__container web-section-content">
                    <div className="subscribe-container">
                        <div className="subscribe-header">
                            <h1 className="subscribe-title">
                                Choose Your Success Plan
                            </h1>
                            <p className="subscribe-subtitle">
                                Start making money from your newsletter today with our AI-powered sponsor matching
                            </p>
                        </div>

                        <div className="subscribe-cards">
                            <div className="subscribe-card">
                                <div className="subscribe-card__header">
                                    <h3 className="subscribe-card__title">Basic</h3>
                                    <div className="subscribe-card__price">
                                        <span className="subscribe-card__currency">$</span>
                                        <span className="subscribe-card__amount">29</span>
                                        <span className="subscribe-card__period">/month</span>
                                    </div>
                                </div>
                                
                                <div className="subscribe-card__benefits">
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Access to 300+ verified sponsors</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Basic email templates</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Sponsor search and filtering</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Unlimited outreach emails</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Basic analytics dashboard</span>
                                    </div>
                                </div>
                                
                                <button 
                                    className="subscribe-card__cta-button" 
                                    onClick={() => handlePlanSelect('basic')}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Start Basic Plan'}
                                </button>
                            </div>

                            <div className="subscribe-card subscribe-card--featured">
                                <div className="subscribe-card__badge">Most Popular</div>
                                <div className="subscribe-card__header">
                                    <h3 className="subscribe-card__title">Pro</h3>
                                    <div className="subscribe-card__price">
                                        <span className="subscribe-card__currency">$</span>
                                        <span className="subscribe-card__amount">79</span>
                                        <span className="subscribe-card__period">/month</span>
                                    </div>
                                </div>
                                
                                <div className="subscribe-card__benefits">
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Everything in Basic</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>AI-powered sponsor matching</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Custom email template generator</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Advanced response rate analytics</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Priority sponsor verification</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>AI assistant for outreach optimization</span>
                                    </div>
                                    <div className="subscribe-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="subscribe-card__benefit-icon" />
                                        <span>Revenue tracking and ROI metrics</span>
                                    </div>
                                </div>
                                
                                <button 
                                    className="subscribe-card__cta-button subscribe-card__cta-button--featured" 
                                    onClick={() => handlePlanSelect('pro')}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Start Pro Plan'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="subscribe-error">
                                {error}
                            </div>
                        )}

                        <div className="subscribe-footer">
                            <p className="subscribe-footer__text">
                                Not ready to subscribe? 
                                <button 
                                    className="subscribe-footer__link" 
                                    onClick={handleSignupClick}
                                >
                                    Create a free account
                                </button>
                                to explore our features
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscribe;
