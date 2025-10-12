import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { validateProperty } from "../components/common/WebJoi";
import axios from "axios";
import config from '../config';
import GoogleLoginButton from "../components/common/GoogleLoginButton";
import tokenManager from '../utils/tokenManager';

interface LoginProps {
    userAuth: boolean;
    isSubscribed: boolean;
}

const Login = ({ userAuth, isSubscribed }: LoginProps) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (userAuth && isSubscribed) {
            window.location.href = '/sponsors';
        }
        else if (userAuth) {
            window.location.href = '/profile';
        }
    })

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const eErrors = validateProperty({ name: 'email', value: email });
        if (eErrors) {
            setEmailError("Invalid email address.");
            return;
        }

        await axios.post(`${config.backendUrl}auth/login`, {
            email: email.toLowerCase(),
            password: password
        }).then((res) => {
            // Store both access and refresh tokens
            tokenManager.storeTokens(res.data.accessToken, res.data.refreshToken);
            
            if (res.data.user.subscription && res.data.user.subscription !== 'none') {
                window.location.href = '/sponsors';
                return;
            }

            window.location.href = '/profile';
        }).catch((err) => {
            setError("Invalid email or password.");
        })
    }

    return (
        <div className="web-page">
            <div className="login-container">
                <form className="login-form " onSubmit={(e) => { handleSubmit(e) }}>
                    <div className="login-form__header-cont">
                        <h1 className="login-form__header">Welcome Back to SponsorDB</h1>
                    </div>
                    <GoogleLoginButton />
                    <div className="login-form__divider">
                        <span>or</span>
                    </div>
                    <input className="input login-form__input" type="email" placeholder="Email Address"
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }} />
                    {emailError && <div className="form-error">{emailError}</div>}
                    <input min={8} className="input login-form__input" type="password" placeholder="Password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }} />
                    {error && <div className="form-error">{error}</div>}
                    <div className="login-form__btn-container">
                        <button disabled={!!emailError || !email || !password || password.length < 8} className="btn login-form__btn" type="submit">Login</button>
                    </div>
                    <Link to="/signup" className="login-form__link">Don't have an account?</Link>
                    <Link to="/change-password" className="login-form__link">Forgot Password?</Link>
                </form>
            </div>
        </div>
    );
}

export default Login;