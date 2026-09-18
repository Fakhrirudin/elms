import api from '@/services/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { Certificate, CertificateListResult } from '../types';

export const certificateService = {
    /**
     * Get paginated certificates for the authenticated employee.
     * GET /api/v1/my-certificates
     */
    async getMyCertificates(page = 1): Promise<CertificateListResult> {
        const response = await api.get<PaginatedResponse<Certificate>>(`/my-certificates?page=${page}`);
        return {
            certificates: response.data.data,
            meta: response.data.meta as CertificateListResult['meta'],
        };
    },

    /**
     * Get single certificate details by certificate ID.
     * GET /api/v1/certificates/{certificateId}
     */
    async getCertificate(certificateId: number | string): Promise<Certificate> {
        const response = await api.get<ApiResponse<Certificate>>(`/certificates/${certificateId}`);
        return response.data.data;
    },

    /**
     * Issue or retrieve existing certificate for an enrollment.
     * POST /api/v1/enrollments/{enrollmentId}/certificate
     * Idempotent: returns 201 when newly created, 200 when already issued.
     */
    async issueCertificate(enrollmentId: number | string): Promise<Certificate> {
        const response = await api.post<ApiResponse<Certificate>>(`/enrollments/${enrollmentId}/certificate`);
        return response.data.data;
    },
};

export default certificateService;

