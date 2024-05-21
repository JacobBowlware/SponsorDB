const Login = () => {
    return (
        <div className="web-page">
            <div className="web-section login">
                <div className="login-container">
                    <form className="form login-form">
                        <h1 className="form__header login-form__header">
                            Login
                        </h1>
                        <input className="form__input login-form__input" type="email" placeholder="Email Address" />
                        <input className="form__input login-form__input" type="password" placeholder="Password" />
                        <button className="btn login-form__btn" type="submit">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;