import { useQuery } from '@tanstack/react-query';
import learningService from '../services/learningService';
import { LearningOverview } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useLearningOverview = (enrollmentId: number | string | undefined) => {
    return useQuery<LearningOverview, AxiosError<ApiError>>({
        queryKey: ['learning-overview', enrollmentId],
        queryFn: () => learningService.getLearningOverview(enrollmentId!),
        enabled: Boolean(enrollmentId),
        staleTime: 1000 * 30,
    });
};

export default useLearningOverview;
