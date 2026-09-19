import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseReportPage from '../pages/CourseReportPage';
import useCourseReport from '../hooks/useCourseReport';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
vi.mock('../hooks/useCourseReport');

const mockUseAuth = vi.mocked(useAuth);
const mockUseCourseReport = vi.mocked(useCourseReport);

describe('CourseReportPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockAdminUser = {
        id: 1,
        name: 'Super Admin',
        email: 'superadmin@elms.test',
        role: 'SUPER_ADMIN' as const,
        is_active: true,
    };

    const mockEmployeeUser = {
        id: 5,
        name: 'Siti Rahmawati',
        email: 'employee@elms.test',
        role: 'EMPLOYEE' as const,
        is_active: true,
    };

    const mockCourseItem = {
        course_id: 1,
        title: 'Enterprise Architecture',
        slug: 'enterprise-architecture',
        status: 'PUBLISHED' as const,
        category: { id: 1, name: 'Architecture' },
        total_enrollments: 12,
        in_progress_count: 7,
        completed_count: 5,
        completion_rate: 41.67,
    };

    it('renders loading skeleton while fetching course report', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseCourseReport.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: true,
        } as any);

        render(
            <MemoryRouter>
                <CourseReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-skeleton')).toBeInTheDocument();
    });

    it('renders course report table with authoritative fields', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseCourseReport.mockReturnValue({
            data: {
                items: [mockCourseItem],
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <CourseReportPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Enterprise Architecture')).toBeInTheDocument();
        expect(screen.getByText('Architecture')).toBeInTheDocument();
        expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
        expect(screen.getByText('41.67%')).toBeInTheDocument();
        expect(screen.getByText('Total Courses: 1')).toBeInTheDocument();
    });

    it('renders empty state when no courses match filter', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseCourseReport.mockReturnValue({
            data: {
                items: [],
                meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <CourseReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-empty-state')).toBeInTheDocument();
        expect(screen.getByText('No Courses Found')).toBeInTheDocument();
    });

    it('blocks employee role with 403 ReportAccessDenied', () => {
        mockUseAuth.mockReturnValue({ user: mockEmployeeUser } as any);
        mockUseCourseReport.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <CourseReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-access-denied')).toBeInTheDocument();
        expect(screen.getByText(/You do not have permission to view Course Performance reports/i)).toBeInTheDocument();
    });
});
