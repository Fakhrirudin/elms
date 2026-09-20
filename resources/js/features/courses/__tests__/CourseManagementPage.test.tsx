import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CourseManagementPage from '../pages/authoring/CourseManagementPage';
import { useAuth } from '@/context/AuthContext';
import courseService from '../services/courseService';

vi.mock('@/context/AuthContext');
vi.mock('../services/courseService');

const mockUseAuth = vi.mocked(useAuth);
const mockCourseService = vi.mocked(courseService);

const renderWithProviders = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{ui}</MemoryRouter>
        </QueryClientProvider>
    );
};

describe('CourseManagementPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockCourseService.getCourses.mockResolvedValue({
            courses: [
                {
                    id: 1,
                    title: 'Laravel Modular Monolith',
                    slug: 'laravel-modular-monolith',
                    status: 'DRAFT',
                    category: { id: 1, name: 'Backend' },
                    estimated_duration: 120,
                    instructors: [{ id: 3, name: 'Ahmad Fauzi', email: 'ahmad@elms.test' }],
                    modules_count: 3,
                    materials_count: 8,
                    updated_at: '2026-09-20T10:00:00Z',
                },
                {
                    id: 2,
                    title: 'React TypeScript Architecture',
                    slug: 'react-typescript-architecture',
                    status: 'PUBLISHED',
                    category: { id: 2, name: 'Frontend' },
                    estimated_duration: 180,
                    instructors: [{ id: 4, name: 'Siti Rahmawati', email: 'siti@elms.test' }],
                    modules_count: 4,
                    materials_count: 12,
                    updated_at: '2026-09-19T10:00:00Z',
                },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 },
        });

        mockCourseService.getCategories.mockResolvedValue([
            { id: 1, name: 'Backend', slug: 'backend' },
            { id: 2, name: 'Frontend', slug: 'frontend' },
        ]);

        mockCourseService.getInstructorCandidates.mockResolvedValue([
            { id: 3, name: 'Ahmad Fauzi', email: 'ahmad@elms.test' },
            { id: 4, name: 'Siti Rahmawati', email: 'siti@elms.test' },
        ]);
    });

    it('renders Course Management dashboard with course items for Admin', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 1, name: 'Admin', email: 'admin@elms.test', role: 'SUPER_ADMIN' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders(<CourseManagementPage />);

        expect(await screen.findByText('Course Management')).toBeInTheDocument();
        expect(screen.getByText('Administrator Scope')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /create course/i })).toHaveAttribute(
            'href',
            '/admin/courses/create'
        );

        expect(await screen.findByText('Laravel Modular Monolith')).toBeInTheDocument();
        expect(screen.getByText('React TypeScript Architecture')).toBeInTheDocument();
        expect(screen.getAllByText('Ahmad Fauzi').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('3')).toBeInTheDocument(); // modules_count
        expect(screen.getByText('8')).toBeInTheDocument(); // materials_count
    });

    it('renders Publish and Archive buttons for Admins based on course status', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 1, name: 'Admin', email: 'admin@elms.test', role: 'SUPER_ADMIN' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders(<CourseManagementPage />);

        expect(await screen.findByRole('button', { name: /publish/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
    });

    it('renders Assigned Courses badge and hides Publish/Archive buttons for Instructors', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 3, name: 'Ahmad Fauzi', email: 'ahmad@elms.test', role: 'INSTRUCTOR' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders(<CourseManagementPage />);

        expect(await screen.findByText('Assigned Courses')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /archive/i })).not.toBeInTheDocument();
    });

    it('renders Access Denied screen for Employees attempting to view course management', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 5, name: 'Employee', email: 'emp@elms.test', role: 'EMPLOYEE' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders(<CourseManagementPage />);

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(
            screen.getByText(/Course authoring is restricted to authorized Instructors and Administrators/i)
        ).toBeInTheDocument();
    });
});
