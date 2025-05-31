import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faArrowRight, faRocket } from '@fortawesome/free-solid-svg-icons';
import '../css/pages/authReq/PaymentSuccess.css';

const PaymentSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Track successful payment
        window.gtag?.('event', 'purchase', {
            currency: 'USD',
            value: 64.99,
            transaction_id: new Date().getTime().toString()
        });
    }, []);

    return (
        <div className="payment-success">
            <div className="payment-success__container">
                <div className="payment-success__icon">
                    <FontAwesomeIcon icon={faCheckCircle} />
                </div>
                
                <h1 className="payment-success__title">
                    Welcome to SponsorTrail! 🎉
                </h1>
                
                <p className="payment-success__message">
                    Thank you for joining our community of newsletter creators. Your payment was successful, and you now have full access to our sponsor database.
                </p>

                <div className="payment-success__features">
                    <div className="payment-success__feature">
                        <FontAwesomeIcon icon={faRocket} className="payment-success__feature-icon" />
                        <span>Access to 250+ verified sponsors</span>
                    </div>
                    <div className="payment-success__feature">
                        <FontAwesomeIcon icon={faRocket} className="payment-success__feature-icon" />
                        <span>Direct contact information</span>
                    </div>
                    <div className="payment-success__feature">
                        <FontAwesomeIcon icon={faRocket} className="payment-success__feature-icon" />
                        <span>Regular database updates</span>
                    </div>
                </div>

                <div className="payment-success__actions">
                    <Link to="/sponsors" className="payment-success__button">
                        View Sponsor Database
                        <FontAwesomeIcon icon={faArrowRight} className="payment-success__button-icon" />
                    </Link>
                </div>

                <p className="payment-success__support">
                    Need help getting started? Check out our <Link to="/guide">quick start guide</Link> or <a href="mailto:support@sponsortrail.com">contact support</a>.
                </p>
            </div>
        </div>
    );
};

export default PaymentSuccess; 