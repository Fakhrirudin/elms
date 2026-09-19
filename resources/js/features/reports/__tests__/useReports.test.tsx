import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import reportService from '../services/reportService';
import useCourseReport from '../hooks/useCourseReport';
import useLearningReport from '../hooks/useLearningReport';
import useQuizReport from '../hooks/useQuizReport';
import { CourseReportItem, LearningReportItem, QuizReportItem } from '../types';

vi.mock('../services/reportService');
const mockService = vi.mocked(reportService);

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

const wrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = createTestQueryClient();
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('Report Hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCourseItem: CourseReportItem = {
        course_id: 1,
        title: 'Enterprise Architecture',
        slug: 'enterprise-architecture',
        status: 'PUBLISHED',
        category: { id: 1, name: 'Tech' },
        total_enrollments: 10,
        in_progress_count: 5,
        completed_count: 5,
        completion_rate: 50.0,
    };

    const mockLearningItem: LearningReportItem = {
        enrollment_id: 1,
        employee: { id: 5, name: 'Siti Rahmawati', nip: null, department: 'IT' },
        course: { id: 1, title: 'Enterprise Architecture' },
        status: 'COMPLETED',
        progress: 100,
        enrolled_at: '2026-09-10T00:00:00Z',
        completed_at: '2026-09-15T00:00:00Z',
    };

    const mockQuizItem: QuizReportItem = {
        quiz_id: 1,
        quiz_title: 'Core Quiz',
        course: { id: 1, title: 'Enterprise Architecture' },
        passing_grade: 70.0,
        total_attempts: 10,
        total_passed: 8,
        total_failed: 2,
        pass_rate: 80.0,
        average_score: 85.0,
        min_score: 60.0,
        max_score: 100.0,
    };

    it('useCourseReport fetches course performance report data', async () => {
        mockService.getCourseReport.mockResolvedValueOnce({
            items: [mockCourseItem],
            meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        });

        const { result } = renderHook(() => useCourseReport({ page: 1, per_page: 15 }), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockService.getCourseReport).toHaveBeenCalledWith({ page: 1, per_page: 15 });
        expect(result.current.data?.items).toHaveLength(1);
        expect(result.current.data?.items[0].completion_rate).toBe(50.0);
    });

    it('useLearningReport fetches learner progress report data', async () => {
        mockService.getLearningReport.mockResolvedValueOnce({
            items: [mockLearningItem],
            meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        });

        const { result } = renderHook(() => useLearningReport({ page: 1, per_page: 15 }), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockService.getLearningReport).toHaveBeenCalledWith({ page: 1, per_page: 15 });
        expect(result.current.data?.items).toHaveLength(1);
        expect(result.current.data?.items[0].progress).toBe(100);
    });

    it('useQuizReport fetches quiz assessment report data', async () => {
        mockService.getQuizReport.mockResolvedValueOnce({
            items: [mockQuizItem],
            meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        });

        const { result } = renderHook(() => useQuizReport({ page: 1, per_page: 15 }), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockService.getQuizReport).toHaveBeenCalledWith({ page: 1, per_page: 15 });
        expect(result.current.data?.items).toHaveLength(1);
        expect(result.current.data?.items[0].pass_rate).toBe(80.0);
    });

    it('useCourseReport does not query when enabled is false', () => {
        const { result } = renderHook(
            () => useCourseReport({ page: 1 }, { enabled: false }),
            { wrapper }
        );

        expect(result.current.fetchStatus).toBe('idle');
        expect(mockService.getCourseReport).not.toHaveBeenCalled();
    });
});
