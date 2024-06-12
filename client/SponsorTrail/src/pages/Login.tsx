import { Link } from "react-router-dom";

const Login = () => {
    return (
        <div className="web-page">
            <div className="login-container">
                <form className="login-form">
                    <div className="login-form__header-cont">
                        <h1 className="login-form__header">Welcome Back to SponsorTrail</h1>
                    </div>
                    <input className="input login-form__input" type="email" placeholder="Email Address" />
                    <input className="input login-form__input" type="password" placeholder="Password" />
                    <button className="btn login-form__btn" type="submit">Login</button>
                    <Link to="/register" className="login-form__link">Don't have an account?</Link>
                </form>
            </div>
        </div>
    );
}

export default Login;