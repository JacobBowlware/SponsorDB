import { Link } from "react-router-dom";

interface FooterProps {
    auth: Boolean;
}

const Footer = ({ auth }: FooterProps) => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <div className="footer-brand">
                        <h3 className="footer-brand-title">SponsorDB</h3>
                        <p className="footer-brand-description">
                            Find newsletter sponsors fast. Direct contacts, no middleman.
                        </p>
                    </div>
                </div>
                
                <div className="footer-section">
                    <h4 className="footer-section-title">Product</h4>
                    <div className="footer-links">
                        <Link className="footer-link" to="/sponsors/">
                            Sponsor Database
                        </Link>
                        <Link className="footer-link" to="/blog/">
                            Blog
                        </Link>
                        <Link className="footer-link" to="/feedback/">
                            Feedback
                        </Link>
                        <Link className="footer-link" to="/newsletter/">
                            Newsletter
                        </Link>
                    </div>
                </div>
                
                <div className="footer-section">
                    <h4 className="footer-section-title">Legal</h4>
                    <div className="footer-links">
                        <Link className="footer-link" to="/privacy-policy">
                            Privacy Policy
                        </Link>
                        <Link className="footer-link" to="/terms-of-service">
                            Terms of Service
                        </Link>
                    </div>
                </div>
                
                <div className="footer-section">
                    <h4 className="footer-section-title">Account</h4>
                    <div className="footer-links">
                        {auth ? (
                            <>
                                <Link className="footer-link" to="/profile/">
                                    Profile
                                </Link>
                                <button 
                                    className="footer-link footer-link--button" 
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        window.location.reload();
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link className="footer-link" to="/signup">
                                    Sign Up
                                </Link>
                                <Link className="footer-link" to="/login">
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <div className="footer-bottom-content">
                    <p className="footer-copyright">
                        © 2025 SponsorDB. All rights reserved.
                    </p>
                    <div className="footer-contact">
                        <a className="footer-contact-link" href="mailto:info@sponsor-db.com">
                            info@sponsor-db.com
                        </a>
                        <a className="footer-contact-link" href="https://x.com/Sponsor_DB" target="_blank" rel="noopener noreferrer">
                            Twitter
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;