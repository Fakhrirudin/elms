import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MyCertificatesPage from '../pages/MyCertificatesPage';
import useMyCertificates from '../hooks/useMyCertificates';

vi.mock('../hooks/useMyCertificates');
const mockUseMyCertificates = vi.mocked(useMyCertificates);

describe('MyCertificatesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCertificates = [
        {
            id: 1,
            certificate_number: 'ELMS-2026-000001',
            enrollment_id: 10,
            course: {
                id: 1,
                title: 'Cybersecurity Fundamentals for ASN',
                slug: 'cybersecurity-fundamentals-asn',
            },
            employee: {
                id: 5,
                name: 'Siti Rahmawati',
                nip: null,
            },
            issued_at: '2026-09-16T10:00:00Z',
            created_at: '2026-09-16T10:00:00Z',
        },
    ];

    it('renders loading skeleton when fetching certificates', () => {
        mockUseMyCertificates.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyCertificatesPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('certificates-loading-skeleton')).toBeInTheDocument();
    });

    it('renders empty state when employee has zero certificates', () => {
        mockUseMyCertificates.mockReturnValue({
            data: {
                certificates: [],
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyCertificatesPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('certificate-empty-state')).toBeInTheDocument();
        expect(screen.getByText('No Certificates Earned Yet')).toBeInTheDocument();
    });

    it('renders error card with retry button when query fails', () => {
        const mockRefetch = vi.fn();
        mockUseMyCertificates.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: { message: 'Failed to fetch certificates' } as any,
            refetch: mockRefetch,
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyCertificatesPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Failed to Load Certificates')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('renders certificates list when certificates are returned', () => {
        mockUseMyCertificates.mockReturnValue({
            data: {
                certificates: mockCertificates,
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyCertificatesPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Cybersecurity Fundamentals for ASN')).toBeInTheDocument();
        expect(screen.getByText('ELMS-2026-000001')).toBeInTheDocument();
    });
});

