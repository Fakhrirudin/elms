import { useMutation, useQueryClient } from '@tanstack/react-query';
import learningService from '../services/learningService';
import { UpdateActivityPayload } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useUpdateActivity = (enrollmentId: number | string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation<any, AxiosError<ApiError>, UpdateActivityPayload>({
        mutationFn: (payload) => learningService.updateCurrentActivity(enrollmentId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learning-overview', enrollmentId] });
            queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
            queryClient.invalidateQueries({ queryKey: ['my-courses'] });
        },
    });
};

export default useUpdateActivity;
