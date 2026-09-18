import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import certificateService from '../services/certificateService';
import useMyCertificates from '../hooks/useMyCertificates';
import useCertificateDetail from '../hooks/useCertificateDetail';
import useIssueCertificate from '../hooks/useIssueCertificate';
import { Certificate } from '../types';

vi.mock('../services/certificateService');
const mockService = vi.mocked(certificateService);

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

const wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = createTestQueryClient();
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('Certificate Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCert: Certificate = {
        id: 1,
        certificate_number: 'ELMS-2026-000001',
        enrollment_id: 10,
        course: { id: 1, title: 'Web Architecture', slug: 'web-architecture' },
        employee: { id: 5, name: 'Siti Rahmawati', nip: null },
        issued_at: '2026-09-16T10:00:00Z',
        created_at: '2026-09-16T10:00:00Z',
    };

    describe('useMyCertificates', () => {
        it('fetches certificates list on mount', async () => {
            mockService.getMyCertificates.mockResolvedValueOnce({
                certificates: [mockCert],
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
            });

            const { result } = renderHook(() => useMyCertificates(1), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(mockService.getMyCertificates).toHaveBeenCalledWith(1);
            expect(result.current.data?.certificates).toHaveLength(1);
            expect(result.current.data?.certificates[0].certificate_number).toBe('ELMS-2026-000001');
        });
    });

    describe('useCertificateDetail', () => {
        it('fetches certificate by id when enabled', async () => {
            mockService.getCertificate.mockResolvedValueOnce(mockCert);

            const { result } = renderHook(() => useCertificateDetail(1), { wrapper });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(mockService.getCertificate).toHaveBeenCalledWith(1);
            expect(result.current.data?.id).toBe(1);
        });

        it('does not fetch when certificateId is undefined', () => {
            const { result } = renderHook(() => useCertificateDetail(undefined), { wrapper });

            expect(result.current.fetchStatus).toBe('idle');
            expect(mockService.getCertificate).not.toHaveBeenCalled();
        });
    });

    describe('useIssueCertificate', () => {
        it('calls issueCertificate and invalidates relevant queries on success', async () => {
            mockService.issueCertificate.mockResolvedValueOnce(mockCert);

            const queryClient = createTestQueryClient();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const customWrapper = ({ children }: { children: React.ReactNode }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            );

            const { result } = renderHook(() => useIssueCertificate(), { wrapper: customWrapper });

            result.current.mutate(10);

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(mockService.issueCertificate).toHaveBeenCalledWith(10);
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-certificates'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['enrollment', 10] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['learning-progress', 10] });
        });
    });
});

