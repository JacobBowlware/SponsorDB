import { useState } from "react";
import { Link } from "react-router-dom";
import { validateProperty } from "../components/common/WebJoi";

const Signup = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleEmailChange = (e: any) => {
        const obj = { name: 'email', value: e.target.value };
        const error = validateProperty(obj);
        console.log(error);
        setEmailError(error);
    }

    const handlePasswordChange = (e: any) => {
        const obj = { name: 'password', value: e.target.value };
        const error = validateProperty(obj);
        console.log(error);
        setPasswordError(error);
    }

    return (
        <div className="web-page">
            <div className="login-container">
                <form className="login-form">
                    <div className="login-form__header-cont">
                        <h1 className="login-form__header">
                            Signup for SponsorTrail
                        </h1>
                    </div>
                    <input className="input login-form__input" type="email" placeholder="Email Address" />
                    <input className="input login-form__input" type="password" placeholder="Password" />
                    <input className="input login-form__input" type="password" placeholder="Repeat Password" />
                    <button className="btn login-form__btn" type="submit">Signup</button>
                    <Link to="/login" className="login-form__link">Have an account?</Link>
                </form>
            </div>
        </div>
    );
}

export default Signup;