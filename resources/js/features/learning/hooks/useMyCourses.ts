import { useQuery } from '@tanstack/react-query';
import learningService from '../services/learningService';
import { MyCoursesParams, MyCoursesResult } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useMyCourses = (params: MyCoursesParams = {}, options?: { enabled?: boolean }) => {
    return useQuery<MyCoursesResult, AxiosError<ApiError>>({
        queryKey: ['my-courses', params],
        queryFn: () => learningService.getMyCourses(params),
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: options?.enabled ?? true,
    });
};

export default useMyCourses;

