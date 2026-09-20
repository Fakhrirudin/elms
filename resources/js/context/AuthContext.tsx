import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '@/features/auth/services/authService';
import { AUTH_TOKEN_KEY } from '@/services/api';
import { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth';
import { User } from '@/types/user';

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<AuthResponse>;
    register?: (payload: RegisterPayload) => Promise<AuthResponse>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(AUTH_TOKEN_KEY);
        }
        return null;
    });
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const logout = useCallback(async () => {
        try {
            if (token) {
                await authService.logout();
            }
        } catch {
            // Ignore logout API network failure, ensure local cleanup
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(AUTH_TOKEN_KEY);
            }
            setToken(null);
            setUser(null);
        }
    }, [token]);

    useEffect(() => {
        let isMounted = true;

        const restoreSession = async () => {
            const storedToken = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
            if (!storedToken) {
                if (isMounted) {
                    setIsLoading(false);
                }
                return;
            }

            try {
                const currentUser = await authService.getMe();
                if (isMounted) {
                    setUser(currentUser);
                    setToken(storedToken);
                }
            } catch {
                if (isMounted) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem(AUTH_TOKEN_KEY);
                    }
                    setToken(null);
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void restoreSession();

        const handleUnauthorized = () => {
            if (isMounted) {
                setToken(null);
                setUser(null);
            }
        };

        window.addEventListener('elms:auth:unauthorized', handleUnauthorized);
        return () => {
            isMounted = false;
            window.removeEventListener('elms:auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const login = useCallback(async (payload: LoginPayload): Promise<AuthResponse> => {
        const response = await authService.login(payload);
        if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        }
        setToken(response.token);
        setUser(response.user);
        return response;
    }, []);

    const register = useCallback(async (payload: RegisterPayload): Promise<AuthResponse> => {
        const response = await authService.register(payload);
        if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        }
        setToken(response.token);
        setUser(response.user);
        return response;
    }, []);

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
