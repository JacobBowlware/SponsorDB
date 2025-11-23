import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { validateProperty } from "../components/common/WebJoi";
import axios from 'axios';
import config from '../config';

const ChangePasswordFinal = () => {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${config.backendUrl}users/change-password-final`, { newPassword: newPassword, token: searchParams.get('token') });
            setPasswordChanged(true);
        }
        catch (error) {
            setError("An error occured... Please try again later.");
            // Error handled silently
        }

        setLoading(false);
    }

    const handleChange = (name: string, e: any) => {
        setError('');
        const obj = { name: name, value: e.target.value };
        const error = validateProperty(obj, newPassword);

        // Bad practice to hard code error messages; JOI default error messages looked messy
        switch (name) {
            case 'password':
                if (error) {
                    setPasswordError("Password must be at least 8 characters long");
                }
                else setPasswordError("");

                if (confirmNewPassword !== e.target.value) {
                    setConfirmPasswordError("Both passwords must match");
                }
                else setConfirmPasswordError("");
                break;
            case 'confirmPassword':
                if (error) {
                    setConfirmPasswordError("Both passwords must match");
                }
                else setConfirmPasswordError("");
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        // Check if token exists in URL
        if (!searchParams.has('token')) {
            // No token, redirect to login
            window.location.href = "/login";
        }


    }, [searchParams])

    return <div className="web-page">
        <div className="change-password-cont">
            {passwordChanged ? <div className="change-password-form">
                <h1 className="change-password-form__header">
                    Password Changed
                </h1>
                <p>
                    Your password has been changed successfully. Please login with your new password.
                </p>
                <Link to="/login" className="btn change-password-form__btn">
                    Login
                </Link>
            </div> : <form className="change-password-form" onSubmit={(e) => handleSubmit(e)}>
                <div className="change-password-form__header-cont">
                    <h1 className="change-password-form__header">
                        SponsorDB
                    </h1>
                    <p>
                        Enter your new password below to reset it.
                    </p>
                </div>
                <input onChange={(e) => {
                    setNewPassword(e.target.value);
                    handleChange('password', e);
                }} value={newPassword} className="input form-input change-password-form__input" type="password" placeholder="New Password" />
                {passwordError && <div className="form-error password-form-error">{passwordError}</div>}
                <input onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    handleChange('confirmPassword', e);
                }} value={confirmNewPassword} className="input form-input change-password-form__input" type="password" placeholder="Repeat New Password" />
                {confirmPasswordError && !error && <div className="form-error password-form-error">{confirmPasswordError}</div>}
                <button
                    disabled={passwordError.length > 0 || confirmPasswordError.length > 0 || newPassword === '' || confirmNewPassword === '' || passwordChanged}
                    id="submitBtn"
                    className="btn form-btn change-password-form__btn"
                    type="submit">{loading ? "..." : "Confirm Password"}</button>
                {passwordChanged && <p className="change-password-form__sent">
                    Password changed successfully! Please login with your new password.
                </p>}
                {error && <p className="change-password-form__error">
                    An error occured... Please try again later.
                </p>}
            </form>}
        </div>
    </div>
}

export default ChangePasswordFinal;