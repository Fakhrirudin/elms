import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CertificateDetailPage from '../pages/CertificateDetailPage';
import useCertificateDetail from '../hooks/useCertificateDetail';

vi.mock('../hooks/useCertificateDetail');
const mockUseCertificateDetail = vi.mocked(useCertificateDetail);

describe('CertificateDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCertificate = {
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

    it('renders skeleton loader while fetching certificate detail', () => {
        mockUseCertificateDetail.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/certificates/1']}>
                <Routes>
                    <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('certificate-detail-skeleton')).toBeInTheDocument();
    });

    it('renders Access Denied state when backend returns 403 Forbidden', () => {
        mockUseCertificateDetail.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: {
                response: { status: 403 },
                message: 'This action is unauthorized.',
            } as any,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/certificates/1']}>
                <Routes>
                    <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('certificate-403-error')).toBeInTheDocument();
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText(/ELMS certificates can only be accessed by the recipient/i)).toBeInTheDocument();
    });

    it('renders Certificate Not Found state when backend returns 404', () => {
        mockUseCertificateDetail.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: {
                response: { status: 404 },
                message: 'Certificate not found',
            } as any,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/certificates/999']}>
                <Routes>
                    <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('certificate-404-error')).toBeInTheDocument();
        expect(screen.getByText('Certificate Not Found')).toBeInTheDocument();
    });

    it('renders certificate document when certificate is successfully loaded', () => {
        mockUseCertificateDetail.mockReturnValue({
            data: mockCertificate,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/certificates/1']}>
                <Routes>
                    <Route path="/certificates/:certificateId" element={<CertificateDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Certificate of Completion')).toBeInTheDocument();
        expect(screen.getByText('Siti Rahmawati')).toBeInTheDocument();
        expect(screen.getByText('Modern Web Architecture')).toBeInTheDocument();
        expect(screen.getByText('ELMS-2026-000001')).toBeInTheDocument();
    });
});

