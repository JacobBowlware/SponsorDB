import config from '../../config';

const GoogleLoginButton = () => {
    const handleGoogleLogin = () => {
        window.location.href = `${config.backendUrl}auth/google`;
    };

    return (
        <button 
            onClick={handleGoogleLogin}
            className="btn login-form__btn google-btn"
            type="button"
        >
            Continue with Google
        </button>
    );
};

export default GoogleLoginButton; 