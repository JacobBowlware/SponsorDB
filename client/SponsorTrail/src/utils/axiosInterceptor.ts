import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import tokenManager from './tokenManager';

// Create axios instance with interceptors
const apiClient = axios.create();

// Request interceptor to add access token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const accessToken = await tokenManager.getValidAccessToken();
        
        if (accessToken) {
            config.headers.set('x-auth-token', accessToken);
        }
        
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh on 401 errors
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        // If we get a 401 and haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Try to refresh the token
                const refreshed = await tokenManager.refreshAccessToken();
                
                if (refreshed && refreshed.accessToken) {
                    // Retry the original request with the new token
                    originalRequest.headers.set('x-auth-token', refreshed.accessToken);
                    
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                // Redirect to login if refresh fails
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;

