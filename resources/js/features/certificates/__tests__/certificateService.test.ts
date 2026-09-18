import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/services/api';
import certificateService from '../services/certificateService';
import { Certificate } from '../types';

vi.mock('@/services/api');
const mockApi = vi.mocked(api);

describe('certificateService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCertificate: Certificate = {
        id: 1,
        certificate_number: 'ELMS-2026-000001',
        enrollment_id: 10,
        course: {
            id: 1,
            title: 'Modern Web Architecture',
            slug: 'modern-web-architecture',
        },
        employee: {
            id: 5,
            name: 'Siti Rahmawati',
            nip: '199507102020122003',
        },
        issued_at: '2026-09-16T10:00:00Z',
        created_at: '2026-09-16T10:00:00Z',
    };

    it('getMyCertificates fetches paginated certificates for authenticated user', async () => {
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'My certificates retrieved successfully',
                data: [mockCertificate],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total: 1,
                    from: 1,
                    to: 1,
                },
            },
        } as any);

        const result = await certificateService.getMyCertificates(1);

        expect(mockApi.get).toHaveBeenCalledWith('/my-certificates?page=1');
        expect(result.certificates).toHaveLength(1);
        expect(result.certificates[0].certificate_number).toBe('ELMS-2026-000001');
        expect(result.meta.total).toBe(1);
    });

    it('getCertificate fetches single certificate detail by id', async () => {
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Certificate retrieved successfully',
                data: mockCertificate,
            },
        } as any);

        const result = await certificateService.getCertificate(1);

        expect(mockApi.get).toHaveBeenCalledWith('/certificates/1');
        expect(result.id).toBe(1);
        expect(result.employee.name).toBe('Siti Rahmawati');
    });

    it('issueCertificate posts to enrollment certificate endpoint', async () => {
        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Certificate issued successfully',
                data: mockCertificate,
            },
        } as any);

        const result = await certificateService.issueCertificate(10);

        expect(mockApi.post).toHaveBeenCalledWith('/enrollments/10/certificate');
        expect(result.certificate_number).toBe('ELMS-2026-000001');
    });

    it('propagates api errors on failure', async () => {
        mockApi.get.mockRejectedValueOnce(new Error('Network Error'));

        await expect(certificateService.getCertificate(99)).rejects.toThrow('Network Error');
    });
});

