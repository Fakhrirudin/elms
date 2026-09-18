import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MyLearningPage from '../pages/MyLearningPage';
import useMyCourses from '../hooks/useMyCourses';
import useMyCertificates from '@/features/certificates/hooks/useMyCertificates';

vi.mock('../hooks/useMyCourses');
vi.mock('@/features/certificates/hooks/useMyCertificates');

const mockUseMyCourses = vi.mocked(useMyCourses);
const mockUseMyCertificates = vi.mocked(useMyCertificates);

describe('MyLearningPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseMyCertificates.mockReturnValue({
            data: { certificates: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: null, to: null } },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
    });

    const mockEnrollments = [
        {
            id: 1,
            user_id: 1,
            course_id: 10,
            status: 'IN_PROGRESS' as const,
            enrolled_at: '2026-03-01T10:00:00Z',
            course: {
                id: 10,
                title: 'Consular Assistance Operations',
                slug: 'consular-assistance-operations',
                description: 'Emergency response and crisis management in foreign missions.',
                thumbnail: null,
                category: { id: 1, name: 'Consular Services' },
                estimated_duration: 6,
                status: 'PUBLISHED' as const,
            },
        },
        {
            id: 2,
            user_id: 1,
            course_id: 11,
            status: 'COMPLETED' as const,
            enrolled_at: '2026-02-15T10:00:00Z',
            completed_at: '2026-02-28T10:00:00Z',
            course: {
                id: 11,
                title: 'Foreign Policy Analysis',
                slug: 'foreign-policy-analysis',
                description: 'Strategic geopolitical frameworks.',
                thumbnail: null,
                category: { id: 2, name: 'Policy' },
                estimated_duration: 10,
                status: 'PUBLISHED' as const,
            },
        },
    ];

    it('renders loading skeleton while fetching enrolled courses', () => {
        mockUseMyCourses.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyLearningPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('my-learning-loading-skeleton')).toBeInTheDocument();
    });

    it('renders empty state when user has no enrollments', () => {
        mockUseMyCourses.mockReturnValue({
            data: {
                enrollments: [],
                meta: { current_page: 1, per_page: 9, total: 0, last_page: 1 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyLearningPage />
            </MemoryRouter>
        );

        expect(screen.getByText('No Course Enrollments Found')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Browse Catalog/i })).toBeInTheDocument();
    });

    it('renders error card with retry button when fetching fails', () => {
        const mockRefetch = vi.fn();
        mockUseMyCourses.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: { message: 'Network connection failed' },
            refetch: mockRefetch,
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyLearningPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Failed to Load Enrolled Courses/i)).toBeInTheDocument();
        expect(screen.getByText('Network connection failed')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
        expect(mockRefetch).toHaveBeenCalled();
    });

    it('renders list of enrolled courses and filters by status tabs', () => {
        mockUseMyCourses.mockReturnValue({
            data: {
                enrollments: mockEnrollments,
                meta: { current_page: 1, per_page: 9, total: 2, last_page: 1 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <MyLearningPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Consular Assistance Operations')).toBeInTheDocument();
        expect(screen.getByText('Foreign Policy Analysis')).toBeInTheDocument();

        // Click "In Progress" tab
        const inProgressTab = screen.getByRole('button', { name: 'In Progress' });
        fireEvent.click(inProgressTab);

        expect(mockUseMyCourses).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'IN_PROGRESS' })
        );
    });

    it('renders View Certificate button on card when course has matching certificate', () => {
        mockUseMyCourses.mockReturnValue({
            data: {
                enrollments: mockEnrollments,
                meta: { current_page: 1, per_page: 9, total: 2, last_page: 1 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);
        mockUseMyCertificates.mockReturnValue({
            data: {
                certificates: [
                    {
                        id: 77,
                        certificate_number: 'ELMS-2026-000077',
                        enrollment_id: 2, // Matches enrollment 2
                        course: { id: 11, title: 'Foreign Policy Analysis', slug: 'foreign-policy' },
                        employee: { id: 1, name: 'Siti Rahmawati', nip: null },
                        issued_at: '2026-09-16T10:00:00Z',
                        created_at: '2026-09-16T10:00:00Z',
                    },
                ],
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter>
                <MyLearningPage />
            </MemoryRouter>
        );

        const viewCertBtn = screen.getByTestId('card-view-certificate-btn');
        expect(viewCertBtn).toBeInTheDocument();
        expect(viewCertBtn).toHaveAttribute('href', '/certificates/77');
    });
});

