const PrivacyPolicy = () => {
    return (
        <div className="web-page">
            <div className="web-section web-section-content" id="privacy-policy">
                <div className="web-section__container">
                    <div className="policy-container">
                        <div className="policy-header">
                            <h1 className="policy-title">Privacy Policy</h1>
                            <p className="policy-effective-date">Effective Date: January 1, 2025</p>
                        </div>

                        <div className="policy-content">
                            <div className="policy-intro">
                                <p>SponsorDB ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services. By using our services, you consent to the collection and use of your information as described in this policy.</p>
                            </div>

                            <div className="policy-section">
                                <h3>1. Information We Collect</h3>
                                <p>We collect minimal personal information to provide our services:</p>
                                <ul>
                                    <li><strong>Email Address:</strong> Required for account creation and service access</li>
                                    <li><strong>Usage Data:</strong> How you interact with our platform (sponsor views, searches, etc.)</li>
                                    <li><strong>Payment Information:</strong> Processed securely through Stripe (we don't store payment details)</li>
                                </ul>
                            </div>

                            <div className="policy-section">
                                <h3>2. Use of Information</h3>
                                <p>We use your information solely for:</p>
                                <ul>
                                    <li>Providing access to our sponsor database</li>
                                    <li>Account management and authentication</li>
                                    <li>Service improvements and updates</li>
                                    <li>Customer support and communication</li>
                                </ul>
                            </div>

                            <div className="policy-section">
                                <h3>3. Email Communications & Opt-In Policy</h3>
                                <p>We respect your inbox and only send emails when you explicitly opt-in:</p>
                                <ul>
                                    <li><strong>Account Emails:</strong> Essential service notifications (password resets, account updates)</li>
                                    <li><strong>Marketing Emails:</strong> Only sent if you opt-in during signup or later</li>
                                    <li><strong>Newsletter Updates:</strong> Database updates and new features (opt-in only)</li>
                                    <li><strong>Unsubscribe:</strong> You can unsubscribe from marketing emails at any time</li>
                                </ul>
                                <p className="policy-note">We will never send you unsolicited marketing emails without your explicit consent.</p>
                            </div>

                            <div className="policy-section">
                                <h3>4. Data Sharing & Third Parties</h3>
                                <p>We do not sell, rent, or share your personal information with third parties except:</p>
                                <ul>
                                    <li><strong>Payment Processing:</strong> Stripe (for secure payment processing)</li>
                                    <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                                    <li><strong>Service Providers:</strong> Essential services like hosting (with strict privacy requirements)</li>
                                </ul>
                            </div>

                            <div className="policy-section">
                                <h3>5. Data Security</h3>
                                <p>We implement industry-standard security measures to protect your information:</p>
                                <ul>
                                    <li>Encryption of data in transit and at rest</li>
                                    <li>Regular security audits and updates</li>
                                    <li>Limited access to personal information</li>
                                    <li>Secure hosting and infrastructure</li>
                                </ul>
                            </div>

                            <div className="policy-section">
                                <h3>6. Your Rights & Control</h3>
                                <p>You have complete control over your data:</p>
                                <ul>
                                    <li><strong>Access:</strong> View all data we have about you</li>
                                    <li><strong>Correction:</strong> Update or correct your information</li>
                                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                                    <li><strong>Export:</strong> Download your data in a portable format</li>
                                    <li><strong>Opt-out:</strong> Unsubscribe from any email communications</li>
                                </ul>
                            </div>

                            <div className="policy-section">
                                <h3>7. Data Retention</h3>
                                <p>We retain your information only as long as necessary:</p>
                                <ul>
                                    <li><strong>Active Accounts:</strong> Data retained while account is active</li>
                                    <li><strong>Inactive Accounts:</strong> Deleted after 12 months of inactivity</li>
                                    <li><strong>Legal Requirements:</strong> Retained longer if required by law</li>
                                </ul>
                            </div>

                            <div className="policy-section">
                                <h3>8. Cookies & Tracking</h3>
                                <p>We use minimal cookies for essential functionality:</p>
                                <ul>
                                    <li><strong>Session Cookies:</strong> For login and account management</li>
                                    <li><strong>Analytics:</strong> Anonymous usage statistics to improve our service</li>
                                    <li><strong>Preferences:</strong> Remember your settings and preferences</li>
                                </ul>
                                <p>You can disable cookies in your browser settings, though some features may not work properly.</p>
                            </div>

                            <div className="policy-section">
                                <h3>9. Children's Privacy</h3>
                                <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take immediate steps to delete it.</p>
                            </div>

                            <div className="policy-section">
                                <h3>10. Changes to This Policy</h3>
                                <p>We may update this Privacy Policy periodically. When we do:</p>
                                <ul>
                                    <li>We'll post the updated policy on this page</li>
                                    <li>We'll update the effective date</li>
                                    <li>For significant changes, we'll notify you via email</li>
                                    <li>Continued use constitutes acceptance of changes</li>
                                </ul>
                            </div>

                            <div className="policy-section">
                                <h3>11. Contact Us</h3>
                                <p>If you have any questions about this Privacy Policy or want to exercise your rights, please contact us:</p>
                                <div className="policy-contact">
                                    <p><strong>Email:</strong> <a href="mailto:info@sponsor-db.com">info@sponsor-db.com</a></p>
                                    <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
