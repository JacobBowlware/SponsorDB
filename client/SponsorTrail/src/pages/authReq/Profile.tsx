import axios from "axios";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import config from '../../config';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faCreditCard, 
    faSignOutAlt, 
    faCrown, 
    faCog,
    faShieldAlt,
    faEnvelope,
    faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import { User } from '../../types/User';

interface ProfileProps {
    userEmail: string,
    isSubscribed: boolean,
    user: User,
}

const Profile = ({ userEmail, isSubscribed, user }: ProfileProps) => {

    const handleBillingPortal = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}users/customer-portal`, {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            });
            const { url } = response.data;
            window.open(url, '_blank');
        }
        catch (e: any) {
            console.log("Error getting subscription info", e);
        }
    }


    useEffect(() => {
        console.log("User", user);
        console.log("Newsletter Info:", user.newsletterInfo);
        console.log("Newsletter Info type:", typeof user.newsletterInfo);
        console.log("Newsletter Info truthy:", !!user.newsletterInfo);
        if (user.newsletterInfo) {
            console.log("Newsletter Info keys:", Object.keys(user.newsletterInfo));
            console.log("Newsletter Info name:", user.newsletterInfo.name);
        }

        // Migrate empty newsletter info objects to null
        const migrateNewsletterInfo = async () => {
            if (user.newsletterInfo && typeof user.newsletterInfo === 'object' && Object.keys(user.newsletterInfo).length === 0) {
                try {
                    await axios.post(`${config.backendUrl}users/migrate-newsletter-info`, {}, {
                        headers: {
                            'x-auth-token': localStorage.getItem('token')
                        }
                    });
                    console.log("Newsletter info migrated successfully");
                    // Reload the page to get updated user data
                    window.location.reload();
                } catch (error) {
                    console.error("Error migrating newsletter info:", error);
                }
            }
        };

        migrateNewsletterInfo();
    }, [user]);

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1>Account Settings</h1>
                <p>Manage your account information and subscription details</p>
            </div>

            <div className="profile-content">
                <div className="profile-grid">
                    {/* Account Information */}
                    <div className="profile-section">
                        <h2>Account Information</h2>
                        <div className="profile-field">
                            <label>Email Address</label>
                            <div className="profile-value">{userEmail || "..."}</div>
                        </div>
                        <div className="profile-field">
                            <label>Subscription Status</label>
                            <div className={`profile-value ${isSubscribed ? 'status-active' : 'status-inactive'}`}>
                                {isSubscribed ? `${user.subscription?.toUpperCase() || 'ACTIVE'}` : "Inactive"}
                            </div>
                        </div>
                    </div>

                    {/* Subscription Details */}
                    {isSubscribed && user.billing && (
                        <div className="profile-section">
                            <h2>Subscription Details</h2>
                            <div className="profile-field">
                                <label>Plan</label>
                                <div className="profile-value">
                                    {user.subscription === 'pro' ? 'Pro Plan' : 'Basic Plan'} - ${user.billing.monthlyCharge}/{user.billing.currency?.toUpperCase() || 'USD'} per month
                                </div>
                            </div>
                            <div className="profile-field">
                                <label>Next Billing Date</label>
                                <div className="profile-value">
                                    {user.billing.nextBillingDate ? new Date(user.billing.nextBillingDate).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                            <div className="profile-field">
                                <label>Status</label>
                                <div className={`profile-value ${user.billing.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                    {user.billing.status?.toUpperCase() || 'UNKNOWN'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Newsletter Information */}
                    {user.newsletterInfo && user.newsletterInfo.name && (
                        <div className="profile-section">
                            <h2>Newsletter Information</h2>
                            {user.newsletterInfo.name && (
                                <div className="profile-field">
                                    <label>Newsletter Name</label>
                                    <div className="profile-value">{user.newsletterInfo.name}</div>
                                </div>
                            )}
                            {user.newsletterInfo.topic && (
                                <div className="profile-field">
                                    <label>Topic</label>
                                    <div className="profile-value">{user.newsletterInfo.topic}</div>
                                </div>
                            )}
                            {user.newsletterInfo.audience_size && (
                                <div className="profile-field">
                                    <label>Audience Size</label>
                                    <div className="profile-value">{user.newsletterInfo.audience_size.toLocaleString()} subscribers</div>
                                </div>
                            )}
                            {user.newsletterInfo.engagement_rate && (
                                <div className="profile-field">
                                    <label>Engagement Rate</label>
                                    <div className="profile-value">{user.newsletterInfo.engagement_rate}%</div>
                                </div>
                            )}
                            {user.newsletterInfo.publishing_frequency && (
                                <div className="profile-field">
                                    <label>Publishing Frequency</label>
                                    <div className="profile-value">{user.newsletterInfo.publishing_frequency}</div>
                                </div>
                            )}
                            {user.newsletterInfo.outreach_stats?.total_revenue && (
                                <div className="profile-field">
                                    <label>Total Revenue Generated</label>
                                    <div className="profile-value">${user.newsletterInfo.outreach_stats.total_revenue.toLocaleString()}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Newsletter Setup Prompt */}
                    {(!user.newsletterInfo || !user.newsletterInfo.name) && (
                        <div className="profile-section profile-section--highlight">
                            <div className="newsletter-setup-prompt">
                                <div className="newsletter-setup-icon">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </div>
                                <div className="newsletter-setup-content">
                                    <h2>Complete Your Newsletter Profile</h2>
                                    <p>Help us match you with the perfect sponsors by sharing details about your newsletter. This only takes 2 minutes and will significantly improve your sponsor matching experience.</p>
                                    <div className="newsletter-setup-benefits">
                                        <div className="benefit-item">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Better sponsor recommendations</span>
                                        </div>
                                        <div className="benefit-item">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Personalized outreach templates</span>
                                        </div>
                                        <div className="benefit-item">
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Higher response rates</span>
                                        </div>
                                    </div>
                                    <div className="newsletter-setup-actions">
                                        <Link 
                                            className="btn profile-btn profile-btn--primary newsletter-setup-btn" 
                                            to="/onboarding"
                                        >
                                            <FontAwesomeIcon icon={faEnvelope} />
                                            Complete Newsletter Setup
                                        </Link>
                                        <button 
                                            className="btn profile-btn profile-btn--outline newsletter-skip-btn"
                                            onClick={() => {
                                                // You could add analytics tracking here
                                                console.log('User skipped newsletter setup from profile');
                                            }}
                                        >
                                            Maybe Later
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Billing & Payment Management */}
                    {isSubscribed && (
                        <div className="profile-section">
                            <h2>Billing & Payment Management</h2>
                            <div className="billing-info">
                                <div className="billing-info-item">
                                    <div className="billing-info-label">
                                        <FontAwesomeIcon icon={faShieldAlt} />
                                        <span>Payment Security</span>
                                    </div>
                                    <div className="billing-info-description">
                                        Your payment information is securely stored and managed by Stripe, a PCI-compliant payment processor. We never store your payment details on our servers.
                                    </div>
                                </div>
                                <div className="billing-actions">
                                    <button 
                                        className="btn profile-btn profile-btn--primary" 
                                        onClick={handleBillingPortal}
                                    >
                                        <FontAwesomeIcon icon={faCreditCard} />
                                        Manage Billing & Payment
                                    </button>
                                    <p className="billing-note">
                                        Click to access your Stripe customer portal where you can update payment methods, view invoices, and manage your subscription.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Actions */}
                    <div className="profile-section">
                        <h2>Account Actions</h2>
                        <div className="profile-actions">
                            <Link className="btn profile-btn profile-btn--secondary" to="/change-password">
                                <FontAwesomeIcon icon={faCog} />
                                Change Password
                            </Link>
                            <button 
                                className="btn profile-btn profile-btn--danger" 
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    // In development mode, set a flag to prevent auto-auth
                                    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                                        localStorage.setItem('dev_logout', 'true');
                                    }
                                    window.location.reload();
                                }}
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} />
                                Sign Out
                            </button>
                            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                                <button 
                                    className="btn profile-btn profile-btn--secondary" 
                                    onClick={() => {
                                        localStorage.removeItem('dev_logout');
                                        localStorage.setItem('token', 'dev_token_for_localhost');
                                        window.location.reload();
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCrown} />
                                    Reset Dev Mode
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-footer">
                <p>
                    <FontAwesomeIcon icon={faShieldAlt} />
                    All payments are processed and secured by Stripe. We do not store any payment information.
                </p>
            </div>
        </div>
    );
}

export default Profile;