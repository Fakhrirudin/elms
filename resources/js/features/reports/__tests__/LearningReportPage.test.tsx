import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LearningReportPage from '../pages/LearningReportPage';
import useLearningReport from '../hooks/useLearningReport';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
vi.mock('../hooks/useLearningReport');

const mockUseAuth = vi.mocked(useAuth);
const mockUseLearningReport = vi.mocked(useLearningReport);

describe('LearningReportPage', () => {
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

    const mockLearningItem = {
        enrollment_id: 101,
        employee: {
            id: 5,
            name: 'Siti Rahmawati',
            nip: '199507102020122003',
            department: 'Diplomasi Publik',
        },
        course: {
            id: 1,
            title: 'Modern Web Architecture',
        },
        status: 'IN_PROGRESS' as const,
        progress: 75,
        enrolled_at: '2026-09-12T10:00:00Z',
        completed_at: null,
    };

    it('renders loading skeleton while fetching learning report', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseLearningReport.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: true,
        } as any);

        render(
            <MemoryRouter>
                <LearningReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-skeleton')).toBeInTheDocument();
    });

    it('renders learning report table with progress and status badge', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseLearningReport.mockReturnValue({
            data: {
                items: [mockLearningItem],
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
                <LearningReportPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Siti Rahmawati')).toBeInTheDocument();
        expect(screen.getByText('Modern Web Architecture')).toBeInTheDocument();
        expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('Total Enrollments: 1')).toBeInTheDocument();
    });

    it('renders personal learning scope for employee role', () => {
        mockUseAuth.mockReturnValue({ user: mockEmployeeUser } as any);
        mockUseLearningReport.mockReturnValue({
            data: {
                items: [mockLearningItem],
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
                <LearningReportPage />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { level: 1, name: 'My Learning Progress' })).toBeInTheDocument();
        expect(screen.getByText('Personal Learning Record')).toBeInTheDocument();
        expect(screen.getByText('Total Enrolled Courses: 1')).toBeInTheDocument();
    });

    it('renders empty state when no enrollments match filter', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseLearningReport.mockReturnValue({
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
                <LearningReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-empty-state')).toBeInTheDocument();
        expect(screen.getByText('No Enrollments Found')).toBeInTheDocument();
    });
});
