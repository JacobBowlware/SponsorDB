import { Link } from "react-router-dom";

interface FooterProps {
    auth: Boolean;
}

const Footer = ({ auth }: FooterProps) => {
    return (
        <div className="footer-wrap">
            <div className="web-section web-section-dark footer">
                <div className=" footer-container web-section">
                    <Link className="footer-item" to="/privacy-policy">
                        Privacy Policy
                    </Link>
                    <Link className="footer-item" to="/terms-of-service">
                        Terms of Service
                    </Link>
                    <a className="footer-item" href="mailto:sponsordatabase@gmail.com">
                        Contact Us
                    </a>
                    {auth ? <Link className="footer-item " to="/login" onClick={() => {
                        localStorage.removeItem('token');
                        window.location.reload();
                    }}>
                        Logout
                    </Link> : <Link className="footer-item " to="/signup">
                        Sign-up
                    </Link>}
                </div>
                <p className="mt-3">&copy; 2024 SponsorDB. All Rights Reserved.</p>
            </div>
        </div>
    );
}

export default Footer;