import { Link } from "react-router-dom";
import { useState } from "react";
import { validateProperty } from "../components/common/WebJoi";

const Login = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        // Ensure valid email before calling API
        const eErrors = validateProperty({ name: 'email', value: email });
        if (eErrors) {
            setEmailError(eErrors);
            return;
        }

        // Call API to login user, if successful, redirect to dashboard
        // else, display error message with setError('message here')
    }

    return (
        <div className="web-page">
            <div className="login-container">
                <form className="login-form " onSubmit={() => { handleSubmit() }}>
                    <div className="login-form__header-cont">
                        <h1 className="login-form__header">Welcome Back to SponsorTrail</h1>
                    </div>
                    <input className="input login-form__input" type="email" placeholder="Email Address"
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }} />
                    {emailError && <div className="login-form__error">{emailError}</div>}
                    <input className="input login-form__input" type="password" placeholder="Password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }} />
                    <button className="btn login-form__btn" type="submit">Login</button>
                    <Link to="/signup" className="login-form__link">Don't have an account?</Link>
                </form>
            </div>
        </div>
    );
}

export default Login;