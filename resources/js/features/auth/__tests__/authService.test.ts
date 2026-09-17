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
});
