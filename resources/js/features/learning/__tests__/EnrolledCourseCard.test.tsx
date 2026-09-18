import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EnrolledCourseCard from '../components/EnrolledCourseCard';
import { Enrollment } from '../types';

describe('EnrolledCourseCard', () => {
    const mockEnrollment: Enrollment = {
        id: 42,
        user_id: 1,
        course_id: 10,
        status: 'IN_PROGRESS',
        enrolled_at: '2026-03-01T10:00:00Z',
        course: {
            id: 10,
            title: 'Protocol & Bilateral Etiquette',
            slug: 'protocol-and-bilateral-etiquette',
            description: 'Comprehensive guidelines for diplomatic ceremonies and summit proceedings.',
            thumbnail: null,
            category: { id: 2, name: 'Diplomatic Affairs' },
            estimated_duration: 12,
            status: 'PUBLISHED',
            published_at: '2026-02-01T10:00:00Z',
            instructors: [{ id: 5, name: 'Senior Diplomat Maria', email: 'maria@elms.test' }],
        },
    };

    it('renders course title, category, status badge, and duration', () => {
        render(
            <MemoryRouter>
                <EnrolledCourseCard enrollment={mockEnrollment} />
            </MemoryRouter>
        );

        expect(screen.getByText('Protocol & Bilateral Etiquette')).toBeInTheDocument();
        expect(screen.getByText('Diplomatic Affairs')).toBeInTheDocument();
        expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
        expect(screen.getByText(/12h/i)).toBeInTheDocument();
        expect(screen.getByText(/Enrolled:/i)).toBeInTheDocument();
    });

    it('renders Continue Learning action link pointing to /my-learning/:id', () => {
        render(
            <MemoryRouter>
                <EnrolledCourseCard enrollment={mockEnrollment} />
            </MemoryRouter>
        );

        const continueBtn = screen.getByRole('link', { name: /Continue Learning/i });
        expect(continueBtn).toBeInTheDocument();
        expect(continueBtn).toHaveAttribute('href', '/my-learning/42');
    });

    it('renders Review Course button when enrollment status is COMPLETED', () => {
        const completedEnrollment: Enrollment = {
            ...mockEnrollment,
            status: 'COMPLETED',
        };

        render(
            <MemoryRouter>
                <EnrolledCourseCard enrollment={completedEnrollment} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Completed/i)).toBeInTheDocument();
        const reviewBtn = screen.getByRole('link', { name: /Review Course/i });
        expect(reviewBtn).toBeInTheDocument();
        expect(reviewBtn).toHaveAttribute('href', '/my-learning/42');
    });

    it('renders View Certificate button when certificate is provided', () => {
        const completedEnrollment: Enrollment = {
            ...mockEnrollment,
            status: 'COMPLETED',
        };
        const mockCert = {
            id: 99,
            certificate_number: 'ELMS-2026-000099',
            enrollment_id: 42,
            course: { id: 10, title: 'Protocol', slug: 'protocol' },
            employee: { id: 1, name: 'Siti', nip: null },
            issued_at: '2026-09-16T10:00:00Z',
            created_at: '2026-09-16T10:00:00Z',
        };

        render(
            <MemoryRouter>
                <EnrolledCourseCard enrollment={completedEnrollment} certificate={mockCert} />
            </MemoryRouter>
        );

        const viewCertBtn = screen.getByTestId('card-view-certificate-btn');
        expect(viewCertBtn).toBeInTheDocument();
        expect(viewCertBtn).toHaveAttribute('href', '/certificates/99');
        expect(screen.getByText('View Certificate')).toBeInTheDocument();
    });
});

