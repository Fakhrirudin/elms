import { useMutation, useQueryClient } from '@tanstack/react-query';
import learningService from '../services/learningService';
import { MaterialCompletionResult } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

interface CompleteMaterialParams {
    enrollmentId: number | string;
    materialId: number | string;
}

export const useCompleteMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation<MaterialCompletionResult, AxiosError<ApiError>, CompleteMaterialParams>({
        mutationFn: ({ enrollmentId, materialId }) =>
            learningService.completeMaterial(enrollmentId, materialId),
        onSuccess: (_data, { enrollmentId }) => {
            // Authoritative progress recalculation
            queryClient.invalidateQueries({ queryKey: ['learning-progress', enrollmentId] });
            // Enrollment status update (e.g. ENROLLED -> IN_PROGRESS or COMPLETED)
            queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
            // Enrolled courses list status
            queryClient.invalidateQueries({ queryKey: ['my-courses'] });
            // Dashboard active / completed counts
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export default useCompleteMaterial;

