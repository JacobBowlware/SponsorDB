import axios from "axios";
import { useEffect, useState } from "react";
import config from "../config";
import { Link } from "react-router-dom";

//TODO: Currently, the emails are case sensitive. 

const ChangePassword = () => {
    const [checked, setChecked] = useState(false);
    const [user, setUser] = useState({
        email: ""
    });

    const [authedUser, setAuthedUser] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const getUserProfile = async () => {
        // Get user profile information
        await axios.get(`${process.env.REACT_APP_BACKEND_URL}users/me`, {
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        }).then((res) => {
            setUser(res.data);
            setAuthedUser(true);
        }).catch((err) => {
            // Error handled silently
        })
    }

    useEffect(() => {
        if (user.email === "" && !checked && localStorage.getItem('token')) {
            getUserProfile();
            setChecked(true);
        }
    }, [user.email])

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        // Send a password reset email
        await axios.post(`${config.backendUrl}users/change-password`, {
            email: user.email.toLowerCase()
        }).then((res) => {
            setEmailSent(true);
            setError(false);
            const btn = document.getElementById('submitBtn');
            if (btn) {
                btn.setAttribute('disabled', 'true');
            }
        }).catch((err) => {
            setError(true);
            setEmailSent(false);
        });

        setLoading(false);
    }

    return (
        <div className="web-page">
            <div className="forgot-password-page">
                <div className="forgot-password-container">
                    <div className="forgot-password-header">
                        <h1 className="forgot-password-title">
                            Forgot Your Password?
                        </h1>
                        <p className="forgot-password-subtitle">
                            No worries! Enter your email address below and we'll send you a secure link to reset your password.
                        </p>
                    </div>

                    <div className="forgot-password-form-section">
                        <form className="forgot-password-form" onSubmit={(e) => handleSubmit(e)}>
                            <div className="form-field">
                                <label className="form-label">Email Address</label>
                                <input 
                                    type="email" 
                                    onChange={(e) => { setUser({ email: e.target.value }) }} 
                                    value={user.email} 
                                    className="form-input" 
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            <button 
                                disabled={!user.email || loading} 
                                id="submitBtn" 
                                className="form-submit-btn" 
                                type="submit"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>

                            {emailSent && (
                                <div className="success-message">
                                    <div className="success-icon">✓</div>
                                    <div className="success-content">
                                        <h4>Check Your Email</h4>
                                        <p>We've sent a password reset link to your email address. Please check your inbox and spam folder.</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="error-message">
                                    <div className="error-icon">⚠</div>
                                    <div className="error-content">
                                        <h4>Email Not Found</h4>
                                        <p>No account found with that email address. If this is a mistake, please <a href="mailto:info@sponsor-db.com">contact support</a>.</p>
                                    </div>
                                </div>
                            )}

                            <div className="form-footer">
                                <Link to="/login" className="back-to-login-link">
                                    ← Back to Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;