import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCrown, faStar } from '@fortawesome/free-solid-svg-icons';
import { trackPageView, trackButtonClick, trackUserJourney } from '../utils/analytics';
import config from '../config';
import axios from 'axios';

interface SubscribeProps {
    userAuth: boolean;
    isSubscribed: boolean;
    subscription?: string;
}

const Subscribe = ({ userAuth, isSubscribed, subscription }: SubscribeProps) => {
    const [loading, setLoading] = useState<boolean>(false);
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

    const handleSubscribe = async () => {
        setLoading(true);
        setError('');

        try {
            trackButtonClick('subscribe', 'subscribe');
            trackUserJourney('subscribe_selected', 2);

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signup');
                return;
            }

            const response = await axios.post(`${config.backendUrl}users/checkout`, {}, {
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
            trackUserJourney('checkout_error', 3, { error: error.message });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="web-page">
            <div className="web-section web-section-dark mt-0" id="subscribe">
                <div className="web-section__container web-section-content">
                    <div className="subscribe-container">
                        <div className="subscribe-header">
                            <h1 className="subscribe-title">
                                Access Our Sponsor Database
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
                                    <h3 className="home__pricing-card__title">Premium Access</h3>
                                    <div className="home__pricing-card__price">
                                        <span className="home__pricing-card__currency">$</span>
                                        <span className="home__pricing-card__amount">20</span>
                                        <span className="home__pricing-card__period">/month</span>
                                    </div>
                                </div>
                                
                                <div className="home__pricing-card__benefits">
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Access to 300+ verified sponsors</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Direct contact links for each sponsor</span>
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
                                        <span>Sponsor response rate data</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Smart sponsor matching based on your newsletter</span>
                                    </div>
                                    <div className="home__pricing-card__benefit">
                                        <FontAwesomeIcon icon={faCheckCircle} className="home__pricing-card__benefit-icon" />
                                        <span>Advanced filtering by industry & budget</span>
                                    </div>
                                </div>
                                
                                <button 
                                    className="home__pricing-card__cta-button home__pricing-card__cta-button--featured" 
                                    onClick={handleSubscribe}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Start 2-Week Free Trial'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="subscribe-error">
                                {error}
                            </div>
                        )}

                        {/* Trust Indicators */}
                        <div className="subscribe-trust">
                            <div className="subscribe-trust__item">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <span>300+ verified sponsors</span>
                            </div>
                            <div className="subscribe-trust__item">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <span>Proven response rates</span>
                            </div>
                            <div className="subscribe-trust__item">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <span>Cancel anytime</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Subscribe;
