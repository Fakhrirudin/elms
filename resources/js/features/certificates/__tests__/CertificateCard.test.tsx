import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CertificateCard from '../components/CertificateCard';
import { Certificate } from '../types';

describe('CertificateCard', () => {
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

    it('renders certificate number, course title, recipient, and date', () => {
        render(
            <MemoryRouter>
                <CertificateCard certificate={mockCert} />
            </MemoryRouter>
        );

        expect(screen.getByText('ELMS-2026-000001')).toBeInTheDocument();
        expect(screen.getByText('Modern Web Architecture')).toBeInTheDocument();
        expect(screen.getByText('Siti Rahmawati')).toBeInTheDocument();
        expect(screen.getByText(/Issued on/i)).toBeInTheDocument();
    });

    it('renders View Certificate link pointing to /certificates/:id', () => {
        render(
            <MemoryRouter>
                <CertificateCard certificate={mockCert} />
            </MemoryRouter>
        );

        const viewLink = screen.getByRole('link', { name: /View Certificate/i });
        expect(viewLink).toBeInTheDocument();
        expect(viewLink).toHaveAttribute('href', '/certificates/1');
    });
});

