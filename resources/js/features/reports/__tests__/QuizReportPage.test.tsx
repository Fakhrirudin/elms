import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import QuizReportPage from '../pages/QuizReportPage';
import useQuizReport from '../hooks/useQuizReport';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
vi.mock('../hooks/useQuizReport');

const mockUseAuth = vi.mocked(useAuth);
const mockUseQuizReport = vi.mocked(useQuizReport);

describe('QuizReportPage', () => {
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

    const mockQuizItem = {
        quiz_id: 1,
        quiz_title: 'Security Assessment Quiz',
        course: { id: 1, title: 'Cybersecurity Fundamentals' },
        passing_grade: 75.0,
        total_attempts: 20,
        total_passed: 16,
        total_failed: 4,
        pass_rate: 80.0,
        average_score: 84.5,
        min_score: 60.0,
        max_score: 100.0,
    };

    it('renders loading skeleton while fetching quiz report', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseQuizReport.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: true,
        } as any);

        render(
            <MemoryRouter>
                <QuizReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-skeleton')).toBeInTheDocument();
    });

    it('renders quiz report table with authoritative fields', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseQuizReport.mockReturnValue({
            data: {
                items: [mockQuizItem],
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
                <QuizReportPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Security Assessment Quiz')).toBeInTheDocument();
        expect(screen.getByText('Cybersecurity Fundamentals')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument();
        expect(screen.getByText('84.5')).toBeInTheDocument();
        expect(screen.getByText('60')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('Total Quizzes: 1')).toBeInTheDocument();
    });

    it('renders empty state when no quizzes match assignment scope', () => {
        mockUseAuth.mockReturnValue({ user: mockAdminUser } as any);
        mockUseQuizReport.mockReturnValue({
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
                <QuizReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-empty-state')).toBeInTheDocument();
        expect(screen.getByText('No Quizzes Found')).toBeInTheDocument();
    });

    it('blocks employee role with 403 ReportAccessDenied', () => {
        mockUseAuth.mockReturnValue({ user: mockEmployeeUser } as any);
        mockUseQuizReport.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <QuizReportPage />
            </MemoryRouter>
        );

        expect(screen.getByTestId('report-access-denied')).toBeInTheDocument();
        expect(screen.getByText(/You do not have permission to view Quiz Assessment reports/i)).toBeInTheDocument();
    });
});
