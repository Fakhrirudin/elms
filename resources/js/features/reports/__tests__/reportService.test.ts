import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/services/api';
import reportService from '../services/reportService';
import { CourseReportItem, LearningReportItem, QuizReportItem } from '../types';

vi.mock('@/services/api');
const mockApi = vi.mocked(api);

describe('reportService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockCourseItem: CourseReportItem = {
        course_id: 1,
        title: 'Enterprise Laravel Architecture',
        slug: 'enterprise-laravel-architecture',
        status: 'PUBLISHED',
        category: { id: 1, name: 'Software Engineering' },
        total_enrollments: 10,
        in_progress_count: 6,
        completed_count: 4,
        completion_rate: 40.0,
    };

    const mockLearningItem: LearningReportItem = {
        enrollment_id: 101,
        employee: {
            id: 5,
            name: 'Siti Rahmawati',
            nip: '199507102020122003',
            department: 'Diplomasi Publik',
        },
        course: {
            id: 1,
            title: 'Enterprise Laravel Architecture',
        },
        status: 'IN_PROGRESS',
        progress: 60,
        enrolled_at: '2026-09-10T08:00:00Z',
        completed_at: null,
    };

    const mockQuizItem: QuizReportItem = {
        quiz_id: 201,
        quiz_title: 'Architecture Evaluation Quiz',
        course: {
            id: 1,
            title: 'Enterprise Laravel Architecture',
        },
        passing_grade: 75.0,
        total_attempts: 12,
        total_passed: 9,
        total_failed: 3,
        pass_rate: 75.0,
        average_score: 82.5,
        min_score: 50.0,
        max_score: 100.0,
    };

    it('getCourseReport calls GET /reports/courses with cleaned query parameters', async () => {
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Course report retrieved successfully',
                data: [mockCourseItem],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total: 1,
                },
            },
        } as any);

        const result = await reportService.getCourseReport({ page: 1, per_page: 15, status: 'PUBLISHED' });

        expect(mockApi.get).toHaveBeenCalledWith('/reports/courses', {
            params: { page: 1, per_page: 15, status: 'PUBLISHED' },
        });
        expect(result.items).toHaveLength(1);
        expect(result.items[0].completion_rate).toBe(40.0);
        expect(result.meta.total).toBe(1);
    });

    it('getLearningReport calls GET /reports/learning with parameters', async () => {
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Learning report retrieved successfully',
                data: [mockLearningItem],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total: 1,
                },
            },
        } as any);

        const result = await reportService.getLearningReport({ page: 1, per_page: 15, status: 'IN_PROGRESS' });

        expect(mockApi.get).toHaveBeenCalledWith('/reports/learning', {
            params: { page: 1, per_page: 15, status: 'IN_PROGRESS' },
        });
        expect(result.items).toHaveLength(1);
        expect(result.items[0].employee.name).toBe('Siti Rahmawati');
        expect(result.items[0].progress).toBe(60);
    });

    it('getQuizReport calls GET /reports/quiz with parameters', async () => {
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Quiz report retrieved successfully',
                data: [mockQuizItem],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 15,
                    total: 1,
                },
            },
        } as any);

        const result = await reportService.getQuizReport({ page: 1, per_page: 15, course_id: 1 });

        expect(mockApi.get).toHaveBeenCalledWith('/reports/quiz', {
            params: { page: 1, per_page: 15, course_id: 1 },
        });
        expect(result.items).toHaveLength(1);
        expect(result.items[0].quiz_title).toBe('Architecture Evaluation Quiz');
        expect(result.items[0].average_score).toBe(82.5);
    });

    it('propagates API rejection errors when network fails', async () => {
        mockApi.get.mockRejectedValueOnce(new Error('Network error'));

        await expect(reportService.getCourseReport()).rejects.toThrow('Network error');
    });
});
