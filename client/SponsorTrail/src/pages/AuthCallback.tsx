import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import tokenManager from '../utils/tokenManager';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        
        if (accessToken && refreshToken) {
            // Store both tokens using the token manager
            tokenManager.storeTokens(accessToken, refreshToken);
            // Redirect to sponsors page (or wherever you want authenticated users to go)
            window.location.href = '/sponsors';
        } else {
            // If no tokens, redirect to login
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="web-page">
            <div className="login-container">
                <div className="login-form">
                    <h1>Logging you in...</h1>
                </div>
            </div>
        </div>
    );
};

export default AuthCallback; 