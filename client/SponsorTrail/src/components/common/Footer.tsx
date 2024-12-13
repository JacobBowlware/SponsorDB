import { Link } from "react-router-dom";

interface FooterProps {
    auth: Boolean;
}

const Footer = ({ auth }: FooterProps) => {
    return (
        <div className="footer">
            <div className="footer-container">
                <div className="footer-item__cont">
                    <Link className="footer-item" to="/privacy-policy">
                        Privacy Policy
                    </Link>
                    <Link className="footer-item" to="/terms-of-service">
                        Terms of Service
                    </Link>
                </div>
                <div className="footer-item__cont">
                    <a className="footer-item" href="mailto:info@sponsor-db.com">
                        Contact Us
                    </a>
                    <Link className="footer-item" to="/feedback/">
                        Leave Feedback
                    </Link>
                </div>
                {auth ? <Link className="footer-item " to="/login" onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                }}>
                    Logout
                </Link> : <div className="footer-item__cont">
                    <Link className="footer-item " to="/signup">
                        Sign-up
                    </Link>
                    <Link className="footer-item " to="/login">
                        Login
                    </Link>
                </div>}
            </div>
        </div>
    );
}

export default Footer;