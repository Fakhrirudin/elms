import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseDetailPage from '../pages/CourseDetailPage';
import useCourseDetail from '../hooks/useCourseDetail';
import useCourseModules from '../hooks/useCourseModules';

vi.mock('../hooks/useCourseDetail');
vi.mock('../hooks/useCourseModules');

const mockUseCourseDetail = vi.mocked(useCourseDetail);
const mockUseCourseModules = vi.mocked(useCourseModules);

describe('CourseDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCourse = {
        id: 1,
        title: 'Diplomatic Negotiation Techniques',
        slug: 'diplomatic-negotiation-techniques',
        description: 'Advanced negotiation frameworks for bilateral discussions.',
        thumbnail: null,
        category: { id: 1, name: 'Diplomacy' },
        estimated_duration: 8,
        status: 'PUBLISHED' as const,
        published_at: '2026-02-15T10:00:00Z',
        instructors: [{ id: 7, name: 'Ambassador Hassan' }],
    };

    const mockModules = [
        {
            id: 10,
            course_id: 1,
            title: 'Module 1: Principles of Negotiation',
            description: 'Core concepts and strategic positioning.',
            sort_order: 1,
            materials: [
                {
                    id: 101,
                    module_id: 10,
                    title: 'Strategic Briefing Notes',
                    type: 'TEXT' as const,
                    is_mandatory: true,
                    sort_order: 1,
                },
                {
                    id: 102,
                    module_id: 10,
                    title: 'Case Study Dossier',
                    type: 'PDF' as const,
                    is_mandatory: false,
                    sort_order: 2,
                },
                {
                    id: 103,
                    module_id: 10,
                    title: 'Keynote Simulation',
                    type: 'VIDEO' as const,
                    is_mandatory: true,
                    sort_order: 3,
                },
            ],
        },
    ];

    it('renders loading skeleton while course details are loading', () => {
        mockUseCourseDetail.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseCourseModules.mockReturnValue({
            data: [],
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/courses/1']}>
                <Routes>
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('course-detail-skeleton')).toBeInTheDocument();
    });

    it('renders hero metadata, instructors, syllabus modules, and material badges', () => {
        mockUseCourseDetail.mockReturnValue({
            data: mockCourse,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseCourseModules.mockReturnValue({
            data: mockModules,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/courses/1']}>
                <Routes>
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Hero metadata
        expect(screen.getByText('Diplomatic Negotiation Techniques')).toBeInTheDocument();
        expect(screen.getByText('Diplomacy')).toBeInTheDocument();
        expect(screen.getByText('8 hours')).toBeInTheDocument();
        expect(screen.getByText(/ambassador hassan/i)).toBeInTheDocument();
        expect(screen.getByTestId('course-detail-fallback-thumbnail')).toBeInTheDocument();

        // Syllabus modules
        expect(screen.getByText('Module 1: Principles of Negotiation')).toBeInTheDocument();
        expect(screen.getByText('Strategic Briefing Notes')).toBeInTheDocument();
        expect(screen.getByText('Case Study Dossier')).toBeInTheDocument();
        expect(screen.getByText('Keynote Simulation')).toBeInTheDocument();

        // Material types
        expect(screen.getByText('TEXT')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('VIDEO')).toBeInTheDocument();

        // Mandatory/Optional badges
        const mandatoryBadges = screen.getAllByText('Mandatory');
        expect(mandatoryBadges.length).toBe(2);
        expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    it('renders error state when course fetch fails and supports retry', () => {
        const mockRefetch = vi.fn();
        mockUseCourseDetail.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Course 999 does not exist'),
            refetch: mockRefetch,
        } as any);

        mockUseCourseModules.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        render(
            <MemoryRouter initialEntries={['/courses/999']}>
                <Routes>
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText(/course not found/i)).toBeInTheDocument();
        expect(screen.getByText(/course 999 does not exist/i)).toBeInTheDocument();

        const retryBtn = screen.getByRole('button', { name: /retry/i });
        fireEvent.click(retryBtn);
        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
});

