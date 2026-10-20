import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/services/api';
import learningService from '../services/learningService';

vi.mock('@/services/api');
const mockApi = vi.mocked(api);

describe('learningService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('enrollCourse sends POST request to /courses/:id/enroll and returns data', async () => {
        const mockEnrollment = {
            id: 1,
            user_id: 10,
            course_id: 5,
            status: 'ENROLLED' as const,
            enrolled_at: '2026-03-01T10:00:00Z',
        };

        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Course enrolled successfully',
                data: mockEnrollment,
            },
        });

        const result = await learningService.enrollCourse(5);

        expect(mockApi.post).toHaveBeenCalledWith('/courses/5/enroll');
        expect(result).toEqual(mockEnrollment);
    });

    it('getMyCourses sends GET request with pagination and status filters', async () => {
        const mockResult = {
            enrollments: [
                {
                    id: 1,
                    user_id: 10,
                    course_id: 5,
                    status: 'IN_PROGRESS' as const,
                    enrolled_at: '2026-03-01T10:00:00Z',
                },
            ],
            meta: {
                current_page: 2,
                per_page: 10,
                total: 15,
                last_page: 2,
            },
        };

        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Enrolled courses retrieved successfully',
                data: mockResult.enrollments,
                meta: mockResult.meta,
            },
        });

        const result = await learningService.getMyCourses({
            page: 2,
            per_page: 10,
            status: 'IN_PROGRESS',
        });

        expect(mockApi.get).toHaveBeenCalledWith('/my-courses?page=2&per_page=10&status=IN_PROGRESS');
        expect(result).toEqual(mockResult);
    });

    it('getEnrollment sends GET request to /enrollments/:id', async () => {
        const mockEnrollment = {
            id: 3,
            user_id: 10,
            course_id: 2,
            status: 'ENROLLED' as const,
            enrolled_at: '2026-03-01T10:00:00Z',
        };

        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Enrollment retrieved successfully',
                data: mockEnrollment,
            },
        });

        const result = await learningService.getEnrollment(3);

        expect(mockApi.get).toHaveBeenCalledWith('/enrollments/3');
        expect(result).toEqual(mockEnrollment);
    });

    it('getLearningProgress sends GET request to /enrollments/:id/progress', async () => {
        const mockProgress = {
            enrollment_id: 3,
            course_id: 2,
            status: 'IN_PROGRESS' as const,
            progress: 50,
            total_mandatory_materials: 4,
            completed_mandatory_materials: 2,
        };

        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Learning progress retrieved successfully',
                data: mockProgress,
            },
        });

        const result = await learningService.getLearningProgress(3);

        expect(mockApi.get).toHaveBeenCalledWith('/enrollments/3/progress');
        expect(result).toEqual(mockProgress);
    });

    it('completeMaterial sends POST request to /enrollments/:id/materials/:id/complete', async () => {
        const mockCompletion = {
            material_id: 15,
            completed_at: '2026-03-01T12:00:00Z',
            progress: 75,
        };

        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Material marked as completed',
                data: mockCompletion,
            },
        });

        const result = await learningService.completeMaterial(3, 15);

        expect(mockApi.post).toHaveBeenCalledWith('/enrollments/3/materials/15/complete');
        expect(result).toEqual(mockCompletion);
    });

    it('getLearningOverview sends GET request to /enrollments/:id/learning-overview', async () => {
        const mockOverview = {
            enrollment_id: 3,
            course_id: 2,
            status: 'IN_PROGRESS' as const,
            overall_percentage: 60,
            modules: [],
        };

        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Learning overview retrieved',
                data: mockOverview,
            },
        });

        const result = await learningService.getLearningOverview(3);

        expect(mockApi.get).toHaveBeenCalledWith('/enrollments/3/learning-overview');
        expect(result).toEqual(mockOverview);
    });

    it('getCurrentActivity sends GET request to /enrollments/:id/current-activity', async () => {
        const mockCurrent = {
            current_activity: { type: 'MATERIAL', id: 10 },
        };

        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Current activity retrieved',
                data: mockCurrent,
            },
        });

        const result = await learningService.getCurrentActivity(3);

        expect(mockApi.get).toHaveBeenCalledWith('/enrollments/3/current-activity');
        expect(result).toEqual(mockCurrent);
    });

    it('updateCurrentActivity sends POST request to /enrollments/:id/current-activity', async () => {
        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Activity updated',
                data: { success: true },
            },
        });

        const result = await learningService.updateCurrentActivity(3, {
            activity_type: 'QUIZ',
            activity_id: 5,
        });

        expect(mockApi.post).toHaveBeenCalledWith('/enrollments/3/current-activity', {
            activity_type: 'QUIZ',
            activity_id: 5,
        });
        expect(result).toEqual({ success: true });
    });

    it('recalculateProgress sends POST request to /enrollments/:id/recalculate-progress', async () => {
        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Progress recalculated',
                data: { overall_percentage: 100 },
            },
        });

        const result = await learningService.recalculateProgress(3);

        expect(mockApi.post).toHaveBeenCalledWith('/enrollments/3/recalculate-progress');
        expect(result).toEqual({ overall_percentage: 100 });
    });
});

