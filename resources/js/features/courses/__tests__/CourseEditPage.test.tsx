import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CourseEditPage from '../pages/authoring/CourseEditPage';
import { useAuth } from '@/context/AuthContext';
import courseService from '../services/courseService';

vi.mock('@/context/AuthContext');
vi.mock('../services/courseService');

const mockUseAuth = vi.mocked(useAuth);
const mockCourseService = vi.mocked(courseService);

const renderWithProviders = (courseId = '10') => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[`/admin/courses/${courseId}/edit`]}>
                <Routes>
                    <Route path="/admin/courses/:courseId/edit" element={<CourseEditPage />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('CourseEditPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockCourseService.getCourse.mockResolvedValue({
            id: 10,
            title: 'Laravel Clean Architecture',
            slug: 'laravel-clean-architecture',
            status: 'DRAFT',
            category: { id: 1, name: 'Backend' },
            estimated_duration: 150,
            description: 'In-depth clean architecture course.',
            thumbnail: 'https://example.com/thumbnail.png',
            instructors: [{ id: 3, name: 'Ahmad Fauzi', email: 'ahmad@elms.test' }],
        });

        mockCourseService.getCourseModules.mockResolvedValue([
            {
                id: 101,
                course_id: 10,
                title: 'Module 1: Domain-Driven Design',
                sort_order: 1,
                materials: [
                    {
                        id: 201,
                        module_id: 101,
                        title: 'Entities and Value Objects',
                        type: 'TEXT',
                        sort_order: 1,
                        is_mandatory: true,
                    },
                ],
            },
        ]);

        mockCourseService.getCategories.mockResolvedValue([
            { id: 1, name: 'Backend', slug: 'backend' },
        ]);

        mockCourseService.getInstructorCandidates.mockResolvedValue([
            { id: 3, name: 'Ahmad Fauzi', email: 'ahmad@elms.test' },
            { id: 4, name: 'Siti Rahmawati', email: 'siti@elms.test' },
        ]);

        mockCourseService.getCourses.mockResolvedValue({
            courses: [],
            meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 },
        } as any);
    });

    it('renders Course Editor tabs and modules structure', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 1, name: 'Admin', email: 'admin@elms.test', role: 'SUPER_ADMIN' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders('10');

        expect(await screen.findByText('Laravel Clean Architecture')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /course structure/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /course details/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /lifecycle & status/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /instructors/i })).toBeInTheDocument();

        // Check module and material rendering in default Structure tab
        expect(await screen.findByText('Module 1: Domain-Driven Design')).toBeInTheDocument();
        expect(screen.getByText('Entities and Value Objects')).toBeInTheDocument();
    });

    it('switches to Course Details tab and renders course form', async () => {
        const user = userEvent.setup();
        mockUseAuth.mockReturnValue({
            user: { id: 1, name: 'Admin', email: 'admin@elms.test', role: 'SUPER_ADMIN' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders('10');

        const detailsTab = await screen.findByRole('button', { name: /course details/i });
        await user.click(detailsTab);

        expect(await screen.findByDisplayValue('Laravel Clean Architecture')).toBeInTheDocument();
        expect(screen.getByDisplayValue('In-depth clean architecture course.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('switches to Lifecycle tab and shows Publish button for DRAFT course', async () => {
        const user = userEvent.setup();
        mockUseAuth.mockReturnValue({
            user: { id: 1, name: 'Admin', email: 'admin@elms.test', role: 'SUPER_ADMIN' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders('10');

        const lifecycleTab = await screen.findByRole('button', { name: /lifecycle & status/i });
        await user.click(lifecycleTab);

        expect(await screen.findByText(/Ready to Publish\?/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /publish course/i })).toBeInTheDocument();
    });

    it('renders Access Denied for Employees', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 5, name: 'Employee', email: 'emp@elms.test', role: 'EMPLOYEE' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders('10');

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
});
