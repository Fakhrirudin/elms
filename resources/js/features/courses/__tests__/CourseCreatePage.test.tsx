import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CourseCreatePage from '../pages/authoring/CourseCreatePage';
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

describe('CourseCreatePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockCourseService.getCategories.mockResolvedValue([
            { id: 1, name: 'Backend Engineering', slug: 'backend' },
            { id: 2, name: 'Frontend Engineering', slug: 'frontend' },
        ]);

        mockCourseService.getCourses.mockResolvedValue({
            data: [
                {
                    id: 10,
                    title: 'Existing Course',
                    slug: 'existing-course',
                    category: { id: 1, name: 'Backend Engineering', slug: 'backend' },
                } as any,
            ],
            meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
        } as any);
    });

    it('renders course creation form with all required fields', async () => {
        mockUseAuth.mockReturnValue({
            user: { id: 1, name: 'Admin', email: 'admin@elms.test', role: 'SUPER_ADMIN' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderWithProviders(<CourseCreatePage />);

        expect(await screen.findByText('Create New Course')).toBeInTheDocument();
        expect(screen.getByLabelText(/course title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/estimated duration/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/thumbnail url/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create course/i })).toBeInTheDocument();
    });

    it('submits form with valid data and calls createCourse API', async () => {
        const user = userEvent.setup();
        mockUseAuth.mockReturnValue({
            user: { id: 3, name: 'Instructor', email: 'inst@elms.test', role: 'INSTRUCTOR' },
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockCourseService.createCourse.mockResolvedValueOnce({
            id: 99,
            title: 'Modern Architecture',
            slug: 'modern-architecture',
            status: 'DRAFT',
            estimated_duration: 120,
        });

        renderWithProviders(<CourseCreatePage />);

        const titleInput = await screen.findByLabelText(/course title/i);
        await user.type(titleInput, 'Modern Architecture');

        const categorySelect = screen.getByLabelText(/category/i);
        await user.selectOptions(categorySelect, '1');

        const durationInput = screen.getByLabelText(/estimated duration/i);
        await user.clear(durationInput);
        await user.type(durationInput, '120');

        const submitButton = screen.getByRole('button', { name: /create course/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockCourseService.createCourse).toHaveBeenCalledWith({
                title: 'Modern Architecture',
                category_id: 1,
                estimated_duration: 120,
                description: null,
                thumbnail: null,
            });
        });
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

        renderWithProviders(<CourseCreatePage />);

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
});
