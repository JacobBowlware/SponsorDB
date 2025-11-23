import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import tokenManager from '../utils/tokenManager';
import axios from 'axios';
import config from '../config';
import apiClient from '../utils/axiosInterceptor';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Logging you in...');

    useEffect(() => {
        const handleAuthCallback = async () => {
            const accessToken = searchParams.get('accessToken');
            const refreshToken = searchParams.get('refreshToken');
            
            if (!accessToken || !refreshToken) {
                navigate('/login');
                return;
            }

            // Store both tokens using the token manager
            tokenManager.storeTokens(accessToken, refreshToken);
            
            try {
                setStatus('Fetching your profile...');
                
                // Fetch user info to check if they're a new Google signup
                const res = await apiClient.get(`${config.backendUrl}users/me`);
                const user = res.data;
                
                // Check if user is subscribed
                const isSubscribed = Boolean(user.subscription && user.subscription !== 'none');
                
                // Check if user has completed newsletter onboarding
                const hasNewsletterInfo = user.newsletterInfo && user.newsletterInfo.topic;
                
                // Check if user signed up with Google (has googleId)
                const isGoogleSignup = Boolean(user.googleId);
                
                // Determine routing based on user state
                if (isSubscribed) {
                    // Subscribed users go to sponsors
                    setStatus('Redirecting to sponsors...');
                    window.location.href = '/sponsors';
                } else if (isGoogleSignup && !hasNewsletterInfo) {
                    // New Google signup: route to newsletter opt-in first
                    setStatus('Setting up your account...');
                    window.location.href = '/newsletter-opt-in';
                } else if (!hasNewsletterInfo) {
                    // Regular signup or Google signup after opt-in: route to newsletter onboarding
                    setStatus('Setting up your newsletter profile...');
                    window.location.href = '/onboarding';
                } else {
                    // Has newsletter info but not subscribed: route to subscribe
                    setStatus('Redirecting to subscription...');
                    window.location.href = '/subscribe';
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                // On error, redirect to login
                navigate('/login');
            }
        };

        handleAuthCallback();
    }, [searchParams, navigate]);

    return (
        <div className="web-page">
            <div className="login-container">
                <div className="login-form">
                    <h1>{status}</h1>
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <div className="spinner-border text-primary" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthCallback; 