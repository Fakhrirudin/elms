import { useQuery, keepPreviousData } from '@tanstack/react-query';
import reportService from '../services/reportService';
import { LearningReportParams, LearningReportResult } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useLearningReport = (params?: LearningReportParams, options?: { enabled?: boolean }) => {
    return useQuery<LearningReportResult, AxiosError<ApiError>>({
        queryKey: ['reports', 'learning', params],
        queryFn: () => reportService.getLearningReport(params),
        staleTime: 1000 * 60 * 2, // 2 minutes
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
    });
};

export default useLearningReport;
