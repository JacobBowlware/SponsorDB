import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faCheckCircle, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import '../css/pages/Unsubscribe.css';

const Unsubscribe = () => {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        // Get email from URL query parameter
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
            // Automatically unsubscribe when email is found in URL
            handleUnsubscribe(emailParam);
        }
    }, [searchParams]);

    const handleUnsubscribe = async (emailToUnsubscribe: string) => {
        if (!emailToUnsubscribe || !emailToUnsubscribe.includes('@')) {
            setStatus('error');
            setMessage('Invalid email address');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            // Call unsubscribe endpoint with email as query parameter (GET for email links)
            const response = await axios.get(
                `${config.backendUrl}users/newsletter/unsubscribe?email=${encodeURIComponent(emailToUnsubscribe)}`
            );

            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.message || 'You have been successfully unsubscribed');
            } else {
                setStatus('error');
                setMessage(response.data.error || 'Failed to unsubscribe');
            }
        } catch (error: any) {
            console.error('Error unsubscribing:', error);
            setStatus('error');
            if (error.response?.status === 404) {
                setMessage('Email address not found in our system. You may have already been unsubscribed.');
            } else {
                setMessage(error.response?.data?.error || 'Failed to unsubscribe. Please try again.');
            }
        }
    };

    return (
        <div className="unsubscribe-page">
            <div className="unsubscribe-container">
                <div className="unsubscribe-content">
                    {status === 'idle' && (
                        <>
                            <FontAwesomeIcon icon={faEnvelope} className="unsubscribe-icon" />
                            <h1 className="unsubscribe-title">Unsubscribe from Newsletter</h1>
                            <p className="unsubscribe-description">
                                We're sorry to see you go. Please enter your email address to unsubscribe.
                            </p>
                            <div className="unsubscribe-form">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="unsubscribe-input"
                                />
                                <button
                                    onClick={() => handleUnsubscribe(email)}
                                    className="unsubscribe-button"
                                    disabled={!email || !email.includes('@')}
                                >
                                    Unsubscribe
                                </button>
                            </div>
                        </>
                    )}

                    {status === 'loading' && (
                        <>
                            <FontAwesomeIcon icon={faSpinner} spin className="unsubscribe-icon unsubscribe-icon--loading" />
                            <h1 className="unsubscribe-title">Processing...</h1>
                            <p className="unsubscribe-description">
                                Unsubscribing you from our newsletter...
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <FontAwesomeIcon icon={faCheckCircle} className="unsubscribe-icon unsubscribe-icon--success" />
                            <h1 className="unsubscribe-title">Sorry to See You Go</h1>
                            <p className="unsubscribe-description unsubscribe-description--success">
                                {message || 'You have been successfully unsubscribed from our newsletter.'}
                            </p>
                            <p className="unsubscribe-info">
                                You will no longer receive our weekly newsletter. If you change your mind, you can always{' '}
                                <Link to="/newsletter/" className="unsubscribe-link">
                                    subscribe again
                                </Link>.
                            </p>
                            <Link to="/" className="unsubscribe-home-link">
                                Return to Homepage
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <FontAwesomeIcon icon={faExclamationCircle} className="unsubscribe-icon unsubscribe-icon--error" />
                            <h1 className="unsubscribe-title">Error</h1>
                            <p className="unsubscribe-description unsubscribe-description--error">
                                {message || 'Something went wrong. Please try again.'}
                            </p>
                            {email && (
                                <button
                                    onClick={() => handleUnsubscribe(email)}
                                    className="unsubscribe-button unsubscribe-button--retry"
                                >
                                    Try Again
                                </button>
                            )}
                            <Link to="/" className="unsubscribe-home-link">
                                Return to Homepage
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Unsubscribe;

