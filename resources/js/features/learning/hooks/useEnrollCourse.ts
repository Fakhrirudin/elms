import { useMutation, useQueryClient } from '@tanstack/react-query';
import learningService from '../services/learningService';
import { Enrollment } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useEnrollCourse = () => {
    const queryClient = useQueryClient();

    return useMutation<Enrollment, AxiosError<ApiError>, number | string>({
        mutationFn: (courseId: number | string) => learningService.enrollCourse(courseId),
        onSuccess: () => {
            // Invalidate user's enrolled courses list
            queryClient.invalidateQueries({ queryKey: ['my-courses'] });
            // Invalidate dashboard metrics as enrolled count increments
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export default useEnrollCourse;

