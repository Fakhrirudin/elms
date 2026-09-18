import { useQuery } from '@tanstack/react-query';
import certificateService from '../services/certificateService';
import { Certificate } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useCertificateDetail = (certificateId: number | string | undefined) => {
    return useQuery<Certificate, AxiosError<ApiError>>({
        queryKey: ['certificate', certificateId],
        queryFn: () => certificateService.getCertificate(certificateId!),
        enabled: Boolean(certificateId),
        staleTime: 1000 * 60 * 5, // 5 minutes (certificates are immutable)
        retry: (failureCount, error) => {
            const status = error.response?.status;
            if (status && [401, 403, 404].includes(status)) {
                return false;
            }
            return failureCount < 1;
        },
    });
};

export default useCertificateDetail;

