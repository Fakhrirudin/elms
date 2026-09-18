import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CertificateDocument from '../components/CertificateDocument';
import { Certificate } from '../types';

describe('CertificateDocument', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCert: Certificate = {
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

    it('renders certificate document details accurately', () => {
        render(
            <MemoryRouter>
                <CertificateDocument certificate={mockCert} />
            </MemoryRouter>
        );

        expect(screen.getByText('Certificate of Completion')).toBeInTheDocument();
        expect(screen.getByText('Siti Rahmawati')).toBeInTheDocument();
        expect(screen.getByText(/NIP: 199507102020122003/i)).toBeInTheDocument();
        expect(screen.getByText('Modern Web Architecture')).toBeInTheDocument();
        expect(screen.getByText('ELMS-2026-000001')).toBeInTheDocument();
        expect(screen.getByText(/Verified ELMS Record/i)).toBeInTheDocument();
    });

    it('triggers window.print when print button is clicked', () => {
        const printSpy = vi.spyOn(window, 'print').mockImplementation(() => { });

        render(
            <MemoryRouter>
                <CertificateDocument certificate={mockCert} />
            </MemoryRouter>
        );

        const printBtn = screen.getByTestId('print-certificate-btn');
        expect(printBtn).toBeInTheDocument();

        fireEvent.click(printBtn);
        expect(printSpy).toHaveBeenCalledTimes(1);

        printSpy.mockRestore();
    });

    it('renders Back to Certificates link', () => {
        render(
            <MemoryRouter>
                <CertificateDocument certificate={mockCert} />
            </MemoryRouter>
        );

        const backLink = screen.getByRole('link', { name: /Back to Certificates/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/certificates');
    });
});

