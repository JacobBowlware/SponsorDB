import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validateProperty, validateUser } from "../components/common/WebJoi";
import axios from 'axios';
import config from '../config';
import { trackPageView, trackFormSubmission, trackButtonClick, trackUserJourney, trackNavigation, trackConversion } from "../utils/analytics";
import GoogleLoginButton from "../components/common/GoogleLoginButton";
import NewsletterOnboarding from "../components/NewsletterOnboarding";
import '../css/NewsletterOnboarding.css';

interface SignupProps {
    userAuth: boolean;
    isSubscribed: boolean;
    sponsorCount?: number;
    newsletterCount?: number;
    onAuthChange?: (auth: boolean) => void;
    onUserUpdate?: () => void;
}

const Signup = ({ userAuth, isSubscribed, sponsorCount = 300, newsletterCount = 150, onAuthChange, onUserUpdate }: SignupProps) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [error, setError] = useState('');
    const [showNewsletterOnboarding, setShowNewsletterOnboarding] = useState(false);
    const [userToken, setUserToken] = useState('');
    const [isInSignupFlow, setIsInSignupFlow] = useState(false);
    const [newsletterOptIn, setNewsletterOptIn] = useState(false);

    const navigate = useNavigate();

    // Track page view
    useEffect(() => {
        trackPageView('Signup', 'Signup for SponsorDB');
        trackUserJourney('signup_page_view', 1, { sponsorCount, newsletterCount });
    }, [sponsorCount, newsletterCount]);

    useEffect(() => {
        // Don't redirect if we're in the middle of the signup flow
        if (isInSignupFlow) {
            return;
        }
        
        if (userAuth && isSubscribed) {
            trackNavigation('signup', 'sponsors', 'redirect_authenticated_subscribed');
            navigate('/subscribe');
        }
        else if (userAuth) {
            trackNavigation('signup', 'subscribe', 'redirect_authenticated_not_subscribed');
            navigate('/subscribe');
        }
    }, [userAuth, isSubscribed, navigate, isInSignupFlow])

    const handleChange = (name: string, e: any) => {
        setError('');
        const obj = { name: name, value: e.target.value };
        const error = validateProperty(obj, password);

        // Bad practice to hard code error messages; JOI default error messages looked messy
        switch (name) {
            case 'email':
                if (error) {
                    setEmailError("Email is invalid");
                }
                else setEmailError("");
                break;
            case 'password':
                if (error) {
                    setPasswordError("Password must be at least 8 characters long");
                }
                else setPasswordError("");

                if (confirmPassword !== e.target.value) {
                    setConfirmPasswordError("Both passwords must match");
                }
                else setConfirmPasswordError("");
                break;
            case 'confirmPassword':
                if (error) {
                    setConfirmPasswordError("Both passwords must match");
                }
                else setConfirmPasswordError("");
                break;
            default:
        }
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        trackButtonClick('signup_submit', 'signup', { email: email ? 'provided' : 'empty' });
        
        const errors = validateUser({ email: email, password: password, confirmPassword: confirmPassword });
        if (errors) {
            trackFormSubmission('signup', 'signup', false, { error_type: 'validation_error' });
            setConfirmPasswordError("Invalid input, please try again.")
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            return;
        }

        // Set flag to prevent redirect during signup flow
        setIsInSignupFlow(true);
        
        // Check if we're in development mode
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocalDev) {
            // Mock signup for development
            const mockToken = 'dev_token_' + Date.now();
            localStorage.setItem('token', mockToken);
            setUserToken(mockToken);
            
            // DON'T update authentication state yet - wait for newsletter onboarding
            // if (onAuthChange) {
            //     onAuthChange(true);
            // }
            
            // Track successful signup
            trackFormSubmission('signup', 'signup', true, { email: email ? 'provided' : 'empty' });
            trackUserJourney('signup_success', 2, { email: email ? 'provided' : 'empty' });
            trackConversion('signup', undefined, 'USD');

            // Redirect to dedicated onboarding page
            navigate('/onboarding');
            return;
        }

        await axios.post(`${config.backendUrl}users/`, {
            email: email,
            password: password,
            newsletterOptIn: newsletterOptIn
        }).then((res) => {
            const token = res.headers['x-auth-token'];
            localStorage.setItem('token', token);
            setUserToken(token);
            
            // DON'T update authentication state yet - wait for newsletter onboarding
            // if (onAuthChange) {
            //     onAuthChange(true);
            // }
            
            // Track successful signup
            trackFormSubmission('signup', 'signup', true, { email: email ? 'provided' : 'empty' });
            trackUserJourney('signup_success', 2, { email: email ? 'provided' : 'empty' });
            trackConversion('signup', undefined, 'USD');

            // Redirect to dedicated onboarding page
            navigate('/onboarding');

        }).catch((err) => {
            // Reset the signup flow flag on error
            setIsInSignupFlow(false);
            trackFormSubmission('signup', 'signup', false, { error_type: 'api_error' });
            setConfirmPasswordError("An error occurred, please try again.")
        })
    }


    const handleLoginLink = () => {
        trackButtonClick('login_link', 'signup');
    };

    const handleNewsletterOnboardingComplete = async (newsletterInfo: any) => {
        try {
            // Check if we're in development mode
            const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (!isLocalDev) {
                // Update user with newsletter information
                await axios.put(`${config.backendUrl}users/newsletter-info`, newsletterInfo, {
                    headers: {
                        'x-auth-token': userToken
                    }
                });
            } else {
                // In dev mode, just log the newsletter info
                // Store in localStorage for dev mode
                localStorage.setItem('dev_newsletter_info', JSON.stringify(newsletterInfo));
            }
            
            // Update user data in parent component
            if (onUserUpdate) {
                onUserUpdate();
            }
            
            // NOW update authentication state after newsletter onboarding
            if (onAuthChange) {
                onAuthChange(true);
            }
            
            // Reset signup flow flag
            setIsInSignupFlow(false);
            
            trackUserJourney('newsletter_onboarding_complete', 3, { 
                has_newsletter_info: true,
                audience_size: newsletterInfo.audience_size 
            });
            
            navigate('/subscribe');
        } catch (error) {
            console.error('Error saving newsletter info:', error);
            // Reset signup flow flag
            setIsInSignupFlow(false);
            // Still navigate to sponsors even if newsletter info fails to save
            navigate('/subscribe');
        }
    };

    const handleNewsletterOnboardingSkip = () => {
        // Update authentication state after skipping newsletter onboarding
        if (onAuthChange) {
            onAuthChange(true);
        }
        
        // Reset signup flow flag
        setIsInSignupFlow(false);
        trackUserJourney('newsletter_onboarding_skip', 3, { has_newsletter_info: false });
        navigate('/subscribe');
    };

    // Note: newsletter onboarding now lives at /onboarding

    return (
        <div className="web-page">
            <div className="login-container">
                <form className="login-form" onSubmit={(e) => handleSubmit(e)}>
                    <div className="login-form__header-cont">
                        <h1 className="login-form__header">
                            Signup for SponsorTrail
                        </h1>
                        {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                            <div style={{ 
                                background: '#e3f2fd', 
                                border: '1px solid #2196f3', 
                                borderRadius: '4px', 
                                padding: '8px 12px', 
                                margin: '10px 0',
                                fontSize: '14px',
                                color: '#1976d2'
                            }}>
                                🚀 <strong>Development Mode:</strong> Signup will be mocked and you'll go through the full newsletter onboarding flow
                            </div>
                        )}
                    </div>
                    <GoogleLoginButton />
                    <div className="login-form__divider">
                        <span>or</span>
                    </div>
                    <input value={email} className="input login-form__input" type="email" placeholder="Email Address"
                        onChange={(e) => {
                            setEmail(e.target.value);
                            handleChange('email', e);
                        }}
                    />
                    {emailError && <div className="form-error">{emailError}</div>}
                    <input value={password} className="input login-form__input" type="password" placeholder="Password"
                        onChange={(e) => {
                            setPassword(e.target.value)
                            handleChange('password', e);
                        }}
                    />
                    {passwordError && <div className="form-error">{passwordError}</div>}
                    <input value={confirmPassword} className="input login-form__input" type="password" placeholder="Repeat Password"
                        onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            handleChange('confirmPassword', e);
                        }}
                    />
                    {confirmPasswordError && !error && <div className="form-error">{confirmPasswordError}</div>}
                    {error && <div className="form-error">{error}</div>}
                    
                    {/* Newsletter Opt-in Section */}
                    <div className="signup-newsletter-optin">
                        <label className="signup-newsletter-checkbox-label">
                            <input
                                type="checkbox"
                                checked={newsletterOptIn}
                                onChange={(e) => setNewsletterOptIn(e.target.checked)}
                                className="signup-newsletter-checkbox"
                            />
                            <span className="signup-newsletter-label-text">
                                Send me weekly sponsor updates
                            </span>
                        </label>
                        <p className="signup-newsletter-subtext">
                            Get the latest verified sponsors delivered to your inbox. Unsubscribe anytime.
                        </p>
                    </div>

                    <div className="login-form__btn-container">
                        <button disabled={!!emailError || !!passwordError || !!confirmPasswordError || !!error || !email || !password || !confirmPassword} className="btn login-form__btn" type="submit">Start 14-Day Trial</button>
                    </div>
                    <Link to="/login" className="login-form__link" onClick={handleLoginLink}>Have an account?</Link>
                </form>
            </div>
        </div>
    );
}

export default Signup;
