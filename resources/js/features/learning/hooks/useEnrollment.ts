import { useQuery } from '@tanstack/react-query';
import learningService from '../services/learningService';
import { Enrollment } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useEnrollment = (enrollmentId: number | string | undefined) => {
    return useQuery<Enrollment, AxiosError<ApiError>>({
        queryKey: ['enrollment', enrollmentId],
        queryFn: () => learningService.getEnrollment(enrollmentId!),
        enabled: Boolean(enrollmentId),
        staleTime: 1000 * 60 * 2,
    });
};

export default useEnrollment;

