import { useQuery, keepPreviousData } from '@tanstack/react-query';
import reportService from '../services/reportService';
import { QuizReportParams, QuizReportResult } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useQuizReport = (params?: QuizReportParams, options?: { enabled?: boolean }) => {
    return useQuery<QuizReportResult, AxiosError<ApiError>>({
        queryKey: ['reports', 'quiz', params],
        queryFn: () => reportService.getQuizReport(params),
        staleTime: 1000 * 60 * 2, // 2 minutes
        placeholderData: keepPreviousData,
        enabled: options?.enabled ?? true,
    });
};

export default useQuizReport;
