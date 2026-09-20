import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import authService from '@/features/auth/services/authService';
import { AUTH_TOKEN_KEY } from '@/services/api';

vi.mock('@/features/auth/services/authService', () => ({
    default: {
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        getMe: vi.fn(),
    },
}));

const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'EMPLOYEE' as const,
    department_id: 1,
    department: { id: 1, name: 'IT' },
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
};

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('initializes as unauthenticated when no token is in localStorage', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
    });

    it('restores session when token is present in localStorage', async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, 'stored-valid-token');
        (authService.getMe as any).mockResolvedValueOnce(mockUser);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('stored-valid-token');
        expect(authService.getMe).toHaveBeenCalledTimes(1);
    });

    it('clears token if session restoration fails', async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, 'invalid-token');
        (authService.getMe as any).mockRejectedValueOnce(new Error('Unauthorized'));

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('handles login successfully', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        (authService.login as any).mockResolvedValueOnce({
            user: mockUser,
            token: 'new-auth-token',
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.login({ email: 'test@example.com', password: 'password' });
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('new-auth-token');
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('new-auth-token');
    });

    it('handles logout successfully and removes token', async () => {
        localStorage.setItem(AUTH_TOKEN_KEY, 'session-token');
        (authService.getMe as any).mockResolvedValueOnce(mockUser);
        (authService.logout as any).mockResolvedValueOnce(undefined);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('handles register successfully and sets user and token', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        (authService.register as any).mockResolvedValueOnce({
            user: mockUser,
            token: 'new-registered-token',
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.register!({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password',
                password_confirmation: 'password',
                department_id: 1,
            });
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('new-registered-token');
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('new-registered-token');
    });
});
