import { Link } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import config from "../config";

const ChangePassword = () => {
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
        if (user.email === "") {
            getUserProfile();
        }
    }, [user.email])

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        // Send a password reset email
        await axios.post(`${config.backendUrl}users/reset-password`, {
            email: user.email
        }).then((res) => {
            console.log(res.data);
            setEmailSent(true);
            const btn = document.getElementById('submitBtn');
            if (btn) {
                btn.setAttribute('disabled', 'true');
            }
        }).catch((err) => {
            console.log(err);
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
                            SponsorTrail
                        </h1>
                        <p>
                            Enter the email address associated with your account and we'll send you a link to reset your password.
                        </p>
                    </div>
                    <input onChange={(e) => { setUser({ email: e.target.value }) }} value={user.email} className="input form-input change-password-form__input" type="email" placeholder="Email Address" />
                    <button id="submitBtn" className="btn form-btn change-password-form__btn" type="submit">{loading ? "..." : "Send Email"}</button>
                    {!authedUser && <Link to="/signup" className="login-form__link change-password-form__link">Don't have an account?</Link>}
                    {emailSent && <p className="change-password-form__sent">
                        Email sent! Please check your inbox - if you don't see it, check your spam folder.
                    </p>}
                    {error && <p className="change-password-form__error">
                        An error occured... Please try again later.
                    </p> && !emailSent}
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;