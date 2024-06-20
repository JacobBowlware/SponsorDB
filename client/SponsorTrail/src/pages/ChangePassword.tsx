import { Link } from "react-router-dom";

const ChangePassword = () => {
    return (
        <div className="web-page">
            <div className="change-password-cont">
                <form className="change-password-form">
                    <div className="change-password-form__header-cont">
                        <h1 className="change-password-form__header">
                            SponsorTrail
                        </h1>
                        <p>
                            Enter the email address associated with your account and we'll send you a link to reset your password.
                        </p>
                    </div>
                    <input className="input form-input change-password-form__input" type="email" placeholder="Email Address" />
                    <button className="btn form-btn change-password-form__btn" type="submit">Change Password</button>
                    <Link to="/signup" className="login-form__link change-password-form__link">Don't have an account?</Link>
                </form>
            </div>
        </div>
    );
}

export default ChangePassword;