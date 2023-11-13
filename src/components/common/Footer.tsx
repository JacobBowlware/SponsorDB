import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <div className="web-section footer">
            <div className=" footer-container web-section">
                <Link className="footer-item" to="/privacy-policy">
                    Privacy Policy
                </Link>
                <Link className="footer-item" to="/terms-of-service">
                    Terms of Service
                </Link>
                <Link className="footer-item" to="/contact-us">
                    Contact Us
                </Link>
                <a className="footer-item" href="/#hero">
                    Join Waitlist
                </a>
            </div>
        </div>
    );
}

export default Footer;