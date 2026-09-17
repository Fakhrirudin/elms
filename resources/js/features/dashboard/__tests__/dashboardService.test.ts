import { describe, it, expect, beforeEach, vi } from 'vitest';
import dashboardService from '../services/dashboardService';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

describe('dashboardService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls GET /dashboard and returns unwrapped data', async () => {
        const mockDashboardData = {
            total_courses: 5,
            in_progress: 2,
            completed: 3,
            certificates: 2,
        };

        (api.get as any).mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Dashboard retrieved successfully',
                data: mockDashboardData,
            },
        });

        const result = await dashboardService.getDashboard();

        expect(api.get).toHaveBeenCalledWith('/dashboard');
        expect(result).toEqual(mockDashboardData);
    });

    it('propagates error when api call fails', async () => {
        const networkError = new Error('Network Error');
        (api.get as any).mockRejectedValueOnce(networkError);

        await expect(dashboardService.getDashboard()).rejects.toThrow('Network Error');
        expect(api.get).toHaveBeenCalledWith('/dashboard');
    });
});

