import { useQuery } from '@tanstack/react-query';
import certificateService from '../services/certificateService';
import { CertificateListResult } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useMyCertificates = (page = 1, options?: { enabled?: boolean }) => {
    return useQuery<CertificateListResult, AxiosError<ApiError>>({
        queryKey: ['my-certificates', page],
        queryFn: () => certificateService.getMyCertificates(page),
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: options?.enabled ?? true,
    });
};

export default useMyCertificates;

