import api from '@/services/api';
import { ApiResponse } from '@/types/api';
import { DashboardData } from '../types';

export const dashboardService = {
    async getDashboard(): Promise<DashboardData> {
        const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
        return response.data.data;
    },
};

export default dashboardService;

