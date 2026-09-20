import { describe, it, expect, beforeEach, vi } from 'vitest';
import authService from '../services/authService';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

describe('authService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls POST /auth/login and returns auth response', async () => {
        const mockAuthData = {
            user: {
                id: 1,
                name: 'Super Admin',
                email: 'superadmin@elms.test',
                role: 'SUPER_ADMIN' as const,
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
            },
            token: 'mock-token-xyz',
        };

        (api.post as any).mockResolvedValueOnce({
            data: {
                success: true,
                data: mockAuthData,
            },
        });

        const result = await authService.login({
            email: 'superadmin@elms.test',
            password: 'password',
        });

        expect(api.post).toHaveBeenCalledWith('/auth/login', {
            email: 'superadmin@elms.test',
            password: 'password',
        });
        expect(result).toEqual(mockAuthData);
    });

    it('calls POST /auth/logout', async () => {
        (api.post as any).mockResolvedValueOnce({
            data: {
                success: true,
                data: null,
            },
        });

        await authService.logout();
        expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('calls GET /auth/me and returns current user', async () => {
        const mockUser = {
            id: 2,
            name: 'Learning Admin',
            email: 'learningadmin@elms.test',
            role: 'LEARNING_ADMIN' as const,
            department_id: 1,
            department: { id: 1, name: 'Pusdiklat' },
            is_active: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
        };

        (api.get as any).mockResolvedValueOnce({
            data: {
                success: true,
                data: mockUser,
            },
        });

        const result = await authService.getMe();
        expect(api.get).toHaveBeenCalledWith('/auth/me');
        expect(result).toEqual(mockUser);
    });

    it('calls POST /auth/register and returns auth response', async () => {
        const mockAuthData = {
            user: {
                id: 10,
                name: 'Budi Pratama',
                email: 'budi@elms.test',
                role: 'EMPLOYEE' as const,
                department_id: 2,
                department: { id: 2, name: 'HR' },
                is_active: true,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
            },
            token: 'registered-token-123',
        };

        (api.post as any).mockResolvedValueOnce({
            data: {
                success: true,
                data: mockAuthData,
            },
        });

        const payload = {
            name: 'Budi Pratama',
            email: 'budi@elms.test',
            password: 'Password123!',
            password_confirmation: 'Password123!',
            department_id: 2,
        };

        const result = await authService.register(payload);
        expect(api.post).toHaveBeenCalledWith('/auth/register', payload);
        expect(result).toEqual(mockAuthData);
    });

    it('calls POST /auth/forgot-password and returns API response', async () => {
        (api.post as any).mockResolvedValueOnce({
            data: {
                success: true,
                message: 'If the account exists, a password reset link has been sent.',
                data: null,
            },
        });

        const result = await authService.forgotPassword({ email: 'learner@elms.test' });
        expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'learner@elms.test' });
        expect(result.success).toBe(true);
    });

    it('calls POST /auth/reset-password and returns API response', async () => {
        (api.post as any).mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Password has been reset successfully.',
                data: null,
            },
        });

        const payload = {
            token: 'valid-token',
            email: 'learner@elms.test',
            password: 'NewPassword123!',
            password_confirmation: 'NewPassword123!',
        };

        const result = await authService.resetPassword(payload);
        expect(api.post).toHaveBeenCalledWith('/auth/reset-password', payload);
        expect(result.success).toBe(true);
    });

    it('calls GET /auth/departments and returns departments list', async () => {
        const mockDepts = [
            { id: 1, name: 'IT' },
            { id: 2, name: 'HR' },
        ];

        (api.get as any).mockResolvedValueOnce({
            data: {
                success: true,
                data: mockDepts,
            },
        });

        const result = await authService.getDepartments();
        expect(api.get).toHaveBeenCalledWith('/auth/departments');
        expect(result).toEqual(mockDepts);
    });
});
