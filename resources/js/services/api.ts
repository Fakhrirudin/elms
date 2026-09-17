import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';

export const AUTH_TOKEN_KEY = 'elms_auth_token';

export const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Sanctum Bearer token if available
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401, 403, 422, and 500
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    window.dispatchEvent(new CustomEvent('elms:auth:unauthorized'));
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
