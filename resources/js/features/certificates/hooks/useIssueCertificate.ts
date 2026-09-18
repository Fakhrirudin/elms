import { useMutation, useQueryClient } from '@tanstack/react-query';
import certificateService from '../services/certificateService';
import { Certificate } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useIssueCertificate = () => {
    const queryClient = useQueryClient();

    return useMutation<Certificate, AxiosError<ApiError>, number | string>({
        mutationFn: (enrollmentId: number | string) =>
            certificateService.issueCertificate(enrollmentId),
        onSuccess: (_data, enrollmentId) => {
            // Refresh certificates collection for the employee
            queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
            // Refresh employee dashboard certificate metrics
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            // Refresh enrollment status (transitions to COMPLETED)
            queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
            // Refresh learning progress status
            queryClient.invalidateQueries({ queryKey: ['learning-progress', enrollmentId] });
        },
    });
};

export default useIssueCertificate;

