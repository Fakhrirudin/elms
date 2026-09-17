import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseCatalogPage from '../pages/CourseCatalogPage';
import useCourses from '../hooks/useCourses';
import useCategories from '../hooks/useCategories';

vi.mock('../hooks/useCourses');
vi.mock('../hooks/useCategories');
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Admin', role: 'SUPER_ADMIN' },
        isAuthenticated: true,
    }),
}));

const mockUseCourses = vi.mocked(useCourses);
const mockUseCategories = vi.mocked(useCategories);

describe('CourseCatalogPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseCategories.mockReturnValue({
            data: [
                { id: 1, name: 'Diplomacy', slug: 'diplomacy' },
                { id: 2, name: 'Technology', slug: 'technology' },
            ],
            isLoading: false,
        } as any);
    });

    it('renders loading skeleton while fetching courses', () => {
        mockUseCourses.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <CourseCatalogPage />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/loading course catalog/i)).toBeInTheDocument();
    });

    it('renders successful course grid and pagination when data is available', () => {
        mockUseCourses.mockReturnValue({
            data: {
                courses: [
                    {
                        id: 1,
                        title: 'International Treaty Law',
                        slug: 'international-treaty-law',
                        description: 'Detailed analysis of multilateral treaties.',
                        thumbnail: null,
                        category: { id: 1, name: 'Diplomacy' },
                        estimated_duration: 6,
                        status: 'PUBLISHED',
                        instructors: [{ id: 10, name: 'Dr. Jane' }],
                    },
                ],
                meta: {
                    current_page: 1,
                    per_page: 12,
                    total: 25,
                    last_page: 3,
                },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <CourseCatalogPage />
            </MemoryRouter>
        );

        expect(screen.getByText('International Treaty Law')).toBeInTheDocument();
        expect(screen.getByTestId('course-grid')).toBeInTheDocument();
        expect(screen.getByTestId('course-pagination')).toBeInTheDocument();
        expect(
            screen.getByText(
                (_, el) => el?.textContent?.replace(/\s+/g, ' ').trim() === 'Showing 1 to 12 of 25 courses'
            )
        ).toBeInTheDocument();
    });

    it('renders empty state when no courses match search/filters', () => {
        mockUseCourses.mockReturnValue({
            data: {
                courses: [],
                meta: {
                    current_page: 1,
                    per_page: 12,
                    total: 0,
                    last_page: 1,
                },
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <CourseCatalogPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/no courses available/i)).toBeInTheDocument();
    });

    it('renders error state and handles retry request', () => {
        const mockRefetch = vi.fn();
        mockUseCourses.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Failed to load catalog'),
            refetch: mockRefetch,
            isFetching: false,
        } as any);

        render(
            <MemoryRouter>
                <CourseCatalogPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/failed to load courses/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to load catalog/i)).toBeInTheDocument();

        const retryBtn = screen.getByRole('button', { name: /retry request/i });
        fireEvent.click(retryBtn);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
});
