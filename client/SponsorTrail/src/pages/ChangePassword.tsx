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
            console.log(err);
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
            <div className="change-password-cont">
                <form className="change-password-form" onSubmit={(e) => handleSubmit(e)}>
                    <div className="change-password-form__header-cont">
                        <h1 className="change-password-form__header">
                            Forgot Your Password?
                        </h1>
                        <p className="change-password-form__p mb-3">
                            Enter your email address below and we will send you a link to reset it.
                        </p>
                    </div>
                    <input type="email" onChange={(e) => { setUser({ email: e.target.value }) }} value={user.email} className="input form-input change-password-form__input" placeholder="Email Address" />
                    <button disabled={!user.email} id="submitBtn" className="btn form-btn change-password-form__btn" type="submit">{loading ? "..." : "Reset Password"}</button>
                    {emailSent && <p className="change-password-form__sent">
                        Email sent! Please check your inbox - if you don't see it, check your spam folder.
                    </p>}
                    {error && <p className="change-password-form__error">
                        No account found with that email address. If this is a mistake, please <a href="mailto:info@sponsor-db.com">contact support.</a>
                    </p>}
                    <Link to="/login" className="login-form__link">Back to Login</Link>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;