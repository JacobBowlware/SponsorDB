import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faRocket, faCreditCard, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { validateProperty, validateUser } from './common/WebJoi';
import axios from 'axios';
import config from '../config';
import { trackPageView, trackFormSubmission, trackButtonClick, trackUserJourney, trackNavigation } from '../utils/analytics';
import GoogleLoginButton from './common/GoogleLoginButton';
import '../css/SignupFlow.css';

interface SignupFlowProps {
    userAuth: boolean;
    isSubscribed: boolean;
    subscription?: string | null;
    sponsorCount?: number;
    newsletterCount?: number;
    onAuthChange?: (auth: boolean) => void;
    onUserUpdate?: () => void;
}

const SignupFlow: React.FC<SignupFlowProps> = ({ userAuth, isSubscribed, subscription, sponsorCount = 300, newsletterCount = 150, onAuthChange, onUserUpdate }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [error, setError] = useState('');
    // No need for plan selection since there's only one plan
    const [userToken, setUserToken] = useState('');
    const [newsletterInfo, setNewsletterInfo] = useState<any>(null);
    const [showNewsletterPrompt, setShowNewsletterPrompt] = useState(false);
    const [isInSignupFlow, setIsInSignupFlow] = useState(false);

    const navigate = useNavigate();

    // Track page view
    React.useEffect(() => {
        trackPageView('SignupFlow', 'Complete Signup Process');
        trackUserJourney('signup_flow_start', 1, { sponsorCount, newsletterCount });
    }, [sponsorCount, newsletterCount]);

    React.useEffect(() => {
        // Don't redirect if we're in the middle of the signup flow
        if (isInSignupFlow) {
            return;
        }
        
        if (userAuth && subscription) {
            trackNavigation('signup_flow', 'sponsors', 'redirect_authenticated_subscribed');
            navigate('/sponsors');
        }
        else if (userAuth) {
            trackNavigation('signup_flow', 'subscribe', 'redirect_authenticated_not_subscribed');
            navigate('/subscribe');
        }
    }, [userAuth, subscription, navigate, isInSignupFlow]);

    const handleInputChange = (name: string, e: any) => {
        setError('');
        const obj = { name: name, value: e.target.value };
        const error = validateProperty(obj, password);

        switch (name) {
            case 'email':
                if (error) {
                    setEmailError("Email is invalid");
                } else setEmailError("");
                break;
            case 'password':
                if (error) {
                    setPasswordError("Password must be at least 8 characters long");
                } else setPasswordError("");

                if (confirmPassword !== e.target.value) {
                    setConfirmPasswordError("Both passwords must match");
                } else setConfirmPasswordError("");
                break;
            case 'confirmPassword':
                if (error) {
                    setConfirmPasswordError("Both passwords must match");
                } else setConfirmPasswordError("");
                break;
            default:
        }
    };

    const handleSignup = async (e: any) => {
        e.preventDefault();
        trackButtonClick('signup_submit', 'signup_flow', { email: email ? 'provided' : 'empty' });
        
        const errors = validateUser({ email: email, password: password, confirmPassword: confirmPassword });
        if (errors) {
            trackFormSubmission('signup', 'signup_flow', false, { error_type: 'validation_error' });
            setConfirmPasswordError("Invalid input, please try again.");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            return;
        }

        try {
            // Set flag to prevent redirect during signup flow
            setIsInSignupFlow(true);
            
            const response = await axios.post(`${config.backendUrl}users/`, {
                email: email,
                password: password
            });
            
            const token = response.headers['x-auth-token'];
            localStorage.setItem('token', token);
            setUserToken(token);
            
            // DON'T update authentication state yet - wait for newsletter onboarding
            // if (onAuthChange) {
            //     onAuthChange(true);
            // }
            
            trackFormSubmission('signup', 'signup_flow', true, { email: email ? 'provided' : 'empty' });
            trackUserJourney('signup_success', 2, { email: email ? 'provided' : 'empty' });
            
            // Check newsletter info after successful signup
            await checkNewsletterInfo(token);
            
            setCurrentStep(2);
        } catch (err) {
            // Reset the signup flow flag on error
            setIsInSignupFlow(false);
            trackFormSubmission('signup', 'signup_flow', false, { error_type: 'api_error' });
            setConfirmPasswordError("An error occurred, please try again.");
        }
    };

    // No need for plan selection since there's only one plan

    const handleSubscribe = async () => {
        
        try {
            // NOW update authentication state after signup flow is complete
            if (onAuthChange) {
                onAuthChange(true);
            }

            trackUserJourney('subscription_selected', 2);

            // Redirect to Stripe checkout
            const response = await axios.post(`${config.backendUrl}users/checkout`, {}, {
                headers: { 'x-auth-token': userToken }
            });

            if (response.data.checkoutUrl) {
                window.location.href = response.data.checkoutUrl;
            } else {
                // Fallback to subscribe page if no checkout URL
                navigate('/subscribe');
            }
        } catch (error) {
            console.error('Error during subscription:', error);
            // Update authentication state even if subscription fails
            if (onAuthChange) {
                onAuthChange(true);
            }
            // Still navigate to subscribe even if subscription fails
            navigate('/subscribe');
        }
    };

    const handleNewsletterRevisit = () => {
        trackButtonClick('newsletter_revisit', 'signup_flow');
        // Navigate to newsletter onboarding or profile page
        navigate('/profile?tab=newsletter');
    };

    const handleNewsletterInfoUpdate = async (newsletterInfo: any) => {
        try {
            // Update user with newsletter information
            await axios.put(`${config.backendUrl}users/newsletter-info`, newsletterInfo, {
                headers: {
                    'x-auth-token': userToken
                }
            });
            
            // Update user data in parent component
            if (onUserUpdate) {
                onUserUpdate();
            }
            
            // NOW update authentication state after newsletter info is updated
            if (onAuthChange) {
                onAuthChange(true);
            }
            
            trackUserJourney('newsletter_info_updated', 3, { 
                has_newsletter_info: true,
                audience_size: newsletterInfo.audience_size 
            });
        } catch (error) {
            console.error('Error updating newsletter info:', error);
        }
    };

    const checkNewsletterInfo = async (token: string) => {
        try {
            const response = await axios.get(`${config.backendUrl}users/newsletter-info`, {
                headers: { 'x-auth-token': token }
            });
            setNewsletterInfo(response.data);
            // If no newsletter info, show prompt
            if (!response.data || Object.keys(response.data).length === 0) {
                setShowNewsletterPrompt(true);
            }
        } catch (error) {
            console.error('Error fetching newsletter info:', error);
            // Don't show prompt if API fails, just continue with flow
            setShowNewsletterPrompt(false);
        }
    };

    const restartFlow = () => {
        setCurrentStep(1);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setConfirmPasswordError('');
        setEmailError('');
        setPasswordError('');
        setError('');
        // No need to reset plan selection
        setUserToken('');
        setNewsletterInfo(null);
        setShowNewsletterPrompt(false);
        setIsInSignupFlow(false);
        trackButtonClick('restart_flow', 'signup_flow');
    };

    const renderStep1 = () => (
        <div className="signup-step">
            <div className="signup-header">
                <FontAwesomeIcon icon={faRocket} className="signup-icon" />
                <h1>Find High-Paying Newsletter Sponsors</h1>
                <p>Access our database of verified sponsors actively looking to advertise in newsletters. Connect directly with decision-makers and grow your newsletter revenue.</p>
            </div>
            
            <form className="signup-form" onSubmit={handleSignup}>
                <GoogleLoginButton />
                <div className="signup-divider">
                    <span>or</span>
                </div>
                
                <div className="form-group">
                    <input 
                        value={email} 
                        className="signup-input" 
                        type="email" 
                        placeholder="Email Address"
                        onChange={(e) => {
                            setEmail(e.target.value);
                            handleInputChange('email', e);
                        }}
                    />
                    {emailError && <div className="signup-error">{emailError}</div>}
                </div>
                
                <div className="form-group">
                    <input 
                        value={password} 
                        className="signup-input" 
                        type="password" 
                        placeholder="Password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                            handleInputChange('password', e);
                        }}
                    />
                    {passwordError && <div className="signup-error">{passwordError}</div>}
                </div>
                
                <div className="form-group">
                    <input 
                        value={confirmPassword} 
                        className="signup-input" 
                        type="password" 
                        placeholder="Confirm Password"
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            handleInputChange('confirmPassword', e);
                        }}
                    />
                    {confirmPasswordError && <div className="signup-error">{confirmPasswordError}</div>}
                </div>
                
                {error && <div className="signup-error">{error}</div>}
                
                <button 
                    disabled={!!emailError || !!passwordError || !!confirmPasswordError || !!error || !email || !password || !confirmPassword} 
                    className="signup-btn" 
                    type="submit"
                >
                    Get Access to Our Sponsor Database
                </button>
            </form>
        </div>
    );

    // Calculate trial end date (14 days from now)
    const getTrialEndDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const renderStep2 = () => (
        <div className="signup-step">
            <div className="signup-header">
                <FontAwesomeIcon icon={faCreditCard} className="signup-icon" />
                <h1>Start your 14-day free trial</h1>
                <p>Get access to verified sponsors and tools to help you connect with them.</p>
            </div>
            
            {/* Trial info message */}
            <div className="trial-info-message">
                <p>Your trial starts after adding a payment method. You won't be charged until <strong>{getTrialEndDate()}</strong>.</p>
            </div>
            
            {showNewsletterPrompt && (
                <div className="newsletter-prompt">
                    <div className="newsletter-prompt-content">
                        <FontAwesomeIcon icon={faEnvelope} className="newsletter-prompt-icon" />
                        <h3>Complete Your Newsletter Profile</h3>
                        <p>Help us match you with the perfect sponsors by sharing details about your newsletter. This only takes 2 minutes!</p>
                        <button 
                            className="newsletter-prompt-btn"
                            onClick={() => {
                                // Navigate to profile page for newsletter setup
                                navigate('/profile?tab=newsletter');
                            }}
                        >
                            Complete Newsletter Profile
                        </button>
                        <button 
                            className="newsletter-prompt-skip"
                            onClick={() => {
                                setShowNewsletterPrompt(false);
                                // Update authentication state when skipping newsletter
                                if (onAuthChange) {
                                    onAuthChange(true);
                                }
                            }}
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            )}
            
            <div className="pricing-info">
                <div className="pricing-card featured">
                    <div className="pricing-badge">2 Week Free Trial</div>
                    <div className="pricing-header">
                        <h3>Premium Access</h3>
                        <div className="pricing-price">
                            <span className="currency">$</span>
                            <span className="amount">20</span>
                            <span className="period">/month</span>
                        </div>
                    </div>
                    <ul className="pricing-features">
                        <li>✅ Access to 300+ verified sponsors</li>
                        <li>✅ Direct contact links for each sponsor</li>
                        <li>✅ Sponsor search & filtering tools</li>
                        <li>✅ Pre-filled email templates</li>
                        <li>✅ Sponsor response rate data</li>
                        <li>✅ Smart sponsor matching based on your newsletter</li>
                        <li>✅ Advanced filtering by industry & budget</li>
                        <li>✅ 2-week free trial</li>
                        <li>✅ Cancel anytime</li>
                    </ul>
                </div>
            </div>
            
            <button 
                className="signup-btn" 
                onClick={handleSubscribe}
            >
                Start Free Trial
                <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <p className="trial-charge-note">Your card will be charged $20 on {getTrialEndDate()}</p>
        </div>
    );

    const renderProgressBar = () => (
        <div className="signup-progress">
            <div className="progress-bar">
                <div 
                    className="progress-fill" 
                    style={{ width: `${(currentStep / 2) * 100}%` }}
                ></div>
            </div>
            <div className="progress-text-container">
                <span className="progress-text">Step {currentStep} of 2</span>
                {currentStep > 1 && (
                    <button 
                        className="restart-flow-btn"
                        onClick={restartFlow}
                        title="Start over"
                    >
                        Start Over
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="signup-container">
            {renderProgressBar()}
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
        </div>
    );
};

export default SignupFlow;