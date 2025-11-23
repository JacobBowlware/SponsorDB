import axios from 'axios';
import config from '../config';

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

class TokenManager {
    private static instance: TokenManager;
    private refreshPromise: Promise<TokenResponse | null> | null = null;

    private constructor() {}

    public static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }

    // Check if access token is expired or will expire soon (within 5 minutes)
    public isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            const bufferTime = 5 * 60; // 5 minutes buffer
            return payload.exp < (currentTime + bufferTime);
        } catch (error) {
            return true; // If we can't parse the token, consider it expired
        }
    }

    // Refresh access token using refresh token
    public async refreshAccessToken(): Promise<TokenResponse | null> {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
            // No refresh token available
            return null;
        }

        // If there's already a refresh in progress, wait for it
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.performRefresh(refreshToken);
        
        try {
            const result = await this.refreshPromise;
            return result;
        } finally {
            this.refreshPromise = null;
        }
    }

    private async performRefresh(refreshToken: string): Promise<TokenResponse | null> {
        try {
            const response = await axios.post(`${config.backendUrl}auth/refresh`, {
                refreshToken: refreshToken
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            
            // Store the new tokens
            localStorage.setItem('token', accessToken);
            if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
            }

            return { accessToken, refreshToken: newRefreshToken || refreshToken };
        } catch (error) {
            console.error('Token refresh failed:', error);
            
            // If refresh fails, clear all tokens and redirect to login
            this.clearTokens();
            
            // Redirect to login page
            window.location.href = '/login';
            
            return null;
        }
    }

    // Get valid access token (refresh if needed)
    public async getValidAccessToken(): Promise<string | null> {
        const accessToken = localStorage.getItem('token');
        
        if (!accessToken) {
            return null;
        }

        if (!this.isTokenExpired(accessToken)) {
            return accessToken;
        }

        // Token is expired or will expire soon, try to refresh
        const refreshed = await this.refreshAccessToken();
        return refreshed ? refreshed.accessToken : null;
    }

    // Store tokens after successful login
    public storeTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }

    // Clear all tokens
    public clearTokens(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }

    // Logout - revoke refresh token
    public async logout(): Promise<void> {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
            try {
                await axios.post(`${config.backendUrl}auth/logout`, {
                    refreshToken: refreshToken
                });
            } catch (error) {
                console.error('Error during logout:', error);
            }
        }
        
        this.clearTokens();
    }

    // Logout from all devices
    public async logoutAll(): Promise<void> {
        const accessToken = localStorage.getItem('token');
        
        if (accessToken) {
            try {
                await axios.post(`${config.backendUrl}auth/logout-all`, {}, {
                    headers: {
                        'x-auth-token': accessToken
                    }
                });
            } catch (error) {
                console.error('Error during logout all:', error);
            }
        }
        
        this.clearTokens();
    }
}

export default TokenManager.getInstance();

