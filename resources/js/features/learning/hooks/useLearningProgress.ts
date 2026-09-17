import { useQuery } from '@tanstack/react-query';
import learningService from '../services/learningService';
import { LearningProgress } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useLearningProgress = (enrollmentId: number | string | undefined) => {
    return useQuery<LearningProgress, AxiosError<ApiError>>({
        queryKey: ['learning-progress', enrollmentId],
        queryFn: () => learningService.getLearningProgress(enrollmentId!),
        enabled: Boolean(enrollmentId),
        staleTime: 1000 * 30, // 30 seconds
    });
};

export default useLearningProgress;

