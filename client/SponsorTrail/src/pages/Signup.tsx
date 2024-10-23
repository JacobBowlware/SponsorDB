import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { validateProperty, validateUser } from "../components/common/WebJoi";
import axios from 'axios';
import config from '../config';

interface SignupProps {
    userAuth: boolean;
    isSubscribed: boolean;
}

const Signup = ({ userAuth, isSubscribed }: SignupProps) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (userAuth && isSubscribed) {
            window.location.href = '/sponsors';
        }
        else if (userAuth) {
            window.location.href = '/profile';
        }
    })

    const handleChange = (name: string, e: any) => {
        setError('');
        const obj = { name: name, value: e.target.value };
        const error = validateProperty(obj, password);

        // Bad practice to hard code error messages; JOI default error messages looked messy
        switch (name) {
            case 'email':
                if (error) {
                    setEmailError("Email is invalid");
                }
                else setEmailError("");
                break;
            case 'password':
                if (error) {
                    setPasswordError("Password must be at least 8 characters long");
                }
                else setPasswordError("");

                if (confirmPassword !== e.target.value) {
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
        }
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const errors = validateUser({ email: email, password: password, confirmPassword: confirmPassword });
        if (errors) {
            setConfirmPasswordError("Invalid input, please try again.")
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            return;
        }

        await axios.post(`${config.backendUrl}users/`, {
            email: email,
            password: password
        }).then((res) => {
            localStorage.setItem('token', res.headers['x-auth-token']);
            window.location.href = '/subscribe/';
        }).catch((err) => {
            setConfirmPasswordError("An error occurred, please try again.")
        })
    }

    return (
        <div className="web-page">
            <div className="login-container">
                <form className="login-form" onSubmit={(e) => handleSubmit(e)}>
                    <div className="login-form__header-cont">
                        <h1 className="login-form__header">
                            Signup for SponsorDB
                        </h1>
                    </div>
                    <input value={email} className="input login-form__input" type="email" placeholder="Email Address"
                        onChange={(e) => {
                            setEmail(e.target.value);
                            handleChange('email', e);
                        }}
                    />
                    {emailError && <div className="form-error">{emailError}</div>}
                    <input value={password} className="input login-form__input" type="password" placeholder="Password"
                        onChange={(e) => {
                            setPassword(e.target.value)
                            handleChange('password', e);
                        }}
                    />
                    {passwordError && <div className="form-error">{passwordError}</div>}
                    <input value={confirmPassword} className="input login-form__input" type="password" placeholder="Repeat Password"
                        onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            handleChange('confirmPassword', e);
                        }}
                    />
                    {confirmPasswordError && !error && <div className="form-error">{confirmPasswordError}</div>}
                    {error && <div className="form-error">{error}</div>}
                    <div className="login-form__btn-container">
                        <button disabled={!!emailError || !!passwordError || !!confirmPasswordError || !!error || !email || !password || !confirmPassword} className="btn login-form__btn" type="submit">Signup</button>
                    </div>
                    <Link to="/login" className="login-form__link">Have an account?</Link>
                </form>
            </div>
        </div>
    );
}

export default Signup;