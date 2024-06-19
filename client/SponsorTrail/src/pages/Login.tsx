import { Link } from "react-router-dom";
import { useState } from "react";
import { validateProperty } from "../components/common/WebJoi";
import axios from "axios";

interface LoginProps {
    setUserAuth: (auth: boolean) => void;
}

const Login = ({ setUserAuth }: LoginProps) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const eErrors = validateProperty({ name: 'email', value: email });
        if (eErrors) {
            setEmailError("Invalid email address.");
            return;
        }

        await axios.post('http://localhost:3001/api/auth/login', {
            email: email,
            password: password
        }).then((res) => {
            localStorage.setItem('token', res.data.token);
            setUserAuth(true);
            window.location.href = '/sponsors';

        }).catch((err) => {
            setError("Invalid email or password.");
        })
    }

    return (
        <div className="web-page">
            <div className="login-container">
                <form className="login-form " onSubmit={(e) => { handleSubmit(e) }}>
                    <div className="login-form__header-cont">
                        <h1 className="login-form__header">Welcome Back to SponsorTrail</h1>
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
                    <button disabled={!!emailError || !email || !password || password.length < 8} className="btn login-form__btn" type="submit">Login</button>
                    <Link to="/signup" className="login-form__link">Don't have an account?</Link>
                </form>
            </div>
        </div>
    );
}

export default Login;