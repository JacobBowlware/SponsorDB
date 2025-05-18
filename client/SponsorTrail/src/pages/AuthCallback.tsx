import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            // Redirect to sponsors page (or wherever you want authenticated users to go)
            window.location.href = '/sponsors';
        } else {
            // If no token, redirect to login
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