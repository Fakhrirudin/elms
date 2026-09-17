import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../pages/DashboardPage';
import { useAuth } from '@/hooks/useAuth';
import useDashboard from '../hooks/useDashboard';

vi.mock('@/hooks/useAuth');
vi.mock('../hooks/useDashboard');

const mockUseAuth = vi.mocked(useAuth);
const mockUseDashboard = vi.mocked(useDashboard);

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading skeleton while fetching metrics', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                role: 'EMPLOYEE',
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByLabelText(/loading dashboard metrics/i)).toBeInTheDocument();
    });

    it('renders error state and handles retry click', () => {
        const mockRefetch = vi.fn();

        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                role: 'EMPLOYEE',
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: { message: 'Server connection failed' } as any,
            refetch: mockRefetch,
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByText('Failed to Load Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Server connection failed')).toBeInTheDocument();

        const retryBtn = screen.getByRole('button', { name: /try again/i });
        fireEvent.click(retryBtn);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('renders employee dashboard metrics correctly', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 10,
                name: 'Siti Rahmawati',
                email: 'employee@elms.test',
                role: 'EMPLOYEE',
                department_id: 1,
                department: { id: 1, name: 'Pusdiklat' },
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: {
                total_courses: 4,
                in_progress: 2,
                completed: 2,
                certificates: 1,
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByText(/welcome back, siti rahmawati!/i)).toBeInTheDocument();
        expect(screen.getByText('Pusdiklat')).toBeInTheDocument();

        // 4 Employee metric cards
        const totalCoursesCard = screen.getByText('Total Courses').closest('[data-slot="card"]') as HTMLElement;
        expect(within(totalCoursesCard).getByText('4')).toBeInTheDocument();

        const inProgressCard = screen.getByText('In Progress').closest('[data-slot="card"]') as HTMLElement;
        expect(within(inProgressCard).getByText('2')).toBeInTheDocument();

        const completedCard = screen.getByText('Completed').closest('[data-slot="card"]') as HTMLElement;
        expect(within(completedCard).getByText('2')).toBeInTheDocument();

        const certificatesCard = screen.getByText('Certificates').closest('[data-slot="card"]') as HTMLElement;
        expect(within(certificatesCard).getByText('1')).toBeInTheDocument();

        // Completion rate (2 / 4 = 50%)
        expect(screen.getByText('50% Overall Completion')).toBeInTheDocument();
    });

    it('renders employee empty state when total_courses is 0', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 10,
                name: 'New Employee',
                email: 'new@elms.test',
                role: 'EMPLOYEE',
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: {
                total_courses: 0,
                in_progress: 0,
                completed: 0,
                certificates: 0,
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByText('No Course Enrollments Yet')).toBeInTheDocument();
    });

    it('renders instructor dashboard metrics correctly', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 5,
                name: 'Ahmad Dahlan',
                email: 'instructor@elms.test',
                role: 'INSTRUCTOR',
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: {
                assigned_courses: 3,
                total_enrollments: 20,
                completed_courses: 10,
                average_quiz_score: 87.5,
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByText(/welcome back, ahmad dahlan!/i)).toBeInTheDocument();

        const assignedCard = screen.getByText('Assigned Courses').closest('[data-slot="card"]') as HTMLElement;
        expect(within(assignedCard).getByText('3')).toBeInTheDocument();

        const enrollmentsCard = screen.getByText('Total Enrollments').closest('[data-slot="card"]') as HTMLElement;
        expect(within(enrollmentsCard).getByText('20')).toBeInTheDocument();

        const completedCard = screen.getByText('Learner Completions').closest('[data-slot="card"]') as HTMLElement;
        expect(within(completedCard).getByText('10')).toBeInTheDocument();

        const avgScoreCard = screen.getByText('Average Quiz Score').closest('[data-slot="card"]') as HTMLElement;
        expect(within(avgScoreCard).getByText('87.5%')).toBeInTheDocument();
    });

    it('renders super admin dashboard metrics correctly', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                name: 'Budi Santoso',
                email: 'superadmin@elms.test',
                role: 'SUPER_ADMIN',
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: {
                total_employees: 40,
                total_courses: 12,
                published_courses: 8,
                total_enrollments: 95,
                completed_courses: 60,
                average_quiz_score: 84.2,
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByText(/welcome back, budi santoso!/i)).toBeInTheDocument();

        const employeesCard = screen.getByText('Total Employees').closest('[data-slot="card"]') as HTMLElement;
        expect(within(employeesCard).getByText('40')).toBeInTheDocument();

        const coursesCard = screen.getByText('Total Courses').closest('[data-slot="card"]') as HTMLElement;
        expect(within(coursesCard).getByText('12')).toBeInTheDocument();

        const publishedCard = screen.getByText('Published Courses').closest('[data-slot="card"]') as HTMLElement;
        expect(within(publishedCard).getByText('8')).toBeInTheDocument();

        const enrollmentsCard = screen.getByText('Total Enrollments').closest('[data-slot="card"]') as HTMLElement;
        expect(within(enrollmentsCard).getByText('95')).toBeInTheDocument();

        const completedCard = screen.getByText('Completed Courses').closest('[data-slot="card"]') as HTMLElement;
        expect(within(completedCard).getByText('60')).toBeInTheDocument();

        const avgScoreCard = screen.getByText('Average Quiz Score').closest('[data-slot="card"]') as HTMLElement;
        expect(within(avgScoreCard).getByText('84.2%')).toBeInTheDocument();
    });

    it('renders learning admin dashboard using the admin view', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 2,
                name: 'Dewi Lestari',
                email: 'learningadmin@elms.test',
                role: 'LEARNING_ADMIN',
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: {
                total_employees: 30,
                total_courses: 8,
                published_courses: 6,
                total_enrollments: 50,
                completed_courses: 25,
                average_quiz_score: 80.0,
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByText(/welcome back, dewi lestari!/i)).toBeInTheDocument();
        expect(screen.getByText('Total Employees')).toBeInTheDocument();
        expect(screen.getByText('Published Courses')).toBeInTheDocument();
    });

    it('handles unexpected role gracefully without crashing', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 99,
                name: 'Unknown Role User',
                email: 'unknown@elms.test',
                role: 'GUEST' as any,
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseDashboard.mockReturnValue({
            data: {} as any,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(<DashboardPage />);

        expect(screen.getByText(/no customized dashboard view configured for role: guest/i)).toBeInTheDocument();
    });
});
