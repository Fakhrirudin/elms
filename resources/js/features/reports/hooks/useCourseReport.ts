import { useQuery, keepPreviousData } from '@tanstack/react-query';
import reportService from '../services/reportService';
import { CourseReportParams, CourseReportResult } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useCourseReport = (params?: CourseReportParams, options?: { enabled?: boolean }) => {
    return useQuery<CourseReportResult, AxiosError<ApiError>>({
        queryKey: ['reports', 'courses', params],
        queryFn: () => reportService.getCourseReport(params),
        staleTime: 1000 * 60 * 2, // 2 minutes
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
    });
};

export default useCourseReport;
