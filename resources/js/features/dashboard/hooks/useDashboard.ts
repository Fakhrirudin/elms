import { useQuery } from '@tanstack/react-query';
import dashboardService from '../services/dashboardService';
import { DashboardData } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useDashboard = () => {
    return useQuery<DashboardData, AxiosError<ApiError>>({
        queryKey: ['dashboard'],
        queryFn: () => dashboardService.getDashboard(),
        staleTime: 1000 * 60 * 2, // 2 minutes
        retry: (failureCount, error) => {
            const status = error.response?.status;
            if (status && [401, 403, 404].includes(status)) {
                return false;
            }
            return failureCount < 1;
        },
    });
};

export default useDashboard;

