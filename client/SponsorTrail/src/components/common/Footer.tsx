import { Link } from "react-router-dom";

const Footer = () => {
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
                    <a className="footer-item" href="mailto:Jacobbowlware@gmail.com">
                        Contact Us
                    </a>
                    <a className="footer-item " href="/#hero">
                        Join Waitlist
                    </a>
                </div>
                <p className="mt-3">&copy; 2024 Sponsor Trail. All Rights Reserved.</p>
            </div>
        </div>
    );
}

export default Footer;