import api from '@/services/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import {
    Enrollment,
    LearningOverview,
    LearningProgress,
    MaterialCompletionResult,
    MyCoursesParams,
    MyCoursesResult,
    UpdateActivityPayload,
} from '../types';

export const learningService = {
    /**
     * Enroll in a published course.
     * POST /api/v1/courses/{courseId}/enroll
     */
    async enrollCourse(courseId: number | string): Promise<Enrollment> {
        const response = await api.post<ApiResponse<Enrollment>>(`/courses/${courseId}/enroll`);
        return response.data.data;
    },

    /**
     * Get paginated enrolled courses for the authenticated employee.
     * GET /api/v1/my-courses
     */
    async getMyCourses(params: MyCoursesParams = {}): Promise<MyCoursesResult> {
        const queryParams = new URLSearchParams();

        if (params.page) {
            queryParams.append('page', params.page.toString());
        }
        if (params.per_page) {
            queryParams.append('per_page', params.per_page.toString());
        }
        if (params.status) {
            queryParams.append('status', params.status);
        }

        const queryString = queryParams.toString();
        const url = `/my-courses${queryString ? `?${queryString}` : ''}`;

        const response = await api.get<PaginatedResponse<Enrollment>>(url);
        return {
            enrollments: response.data.data,
            meta: response.data.meta,
        };
    },

    /**
     * Get single enrollment details.
     * GET /api/v1/enrollments/{enrollmentId}
     */
    async getEnrollment(enrollmentId: number | string): Promise<Enrollment> {
        const response = await api.get<ApiResponse<Enrollment>>(`/enrollments/${enrollmentId}`);
        return response.data.data;
    },

    /**
     * Get authoritative learning progress for an enrollment.
     * GET /api/v1/enrollments/{enrollmentId}/progress
     */
    async getLearningProgress(enrollmentId: number | string): Promise<LearningProgress> {
        const response = await api.get<ApiResponse<LearningProgress>>(`/enrollments/${enrollmentId}/progress`);
        return response.data.data;
    },

    /**
     * Get authoritative full learning overview (modules, activities, completion status, last activity).
     * GET /api/v1/enrollments/{enrollmentId}/learning-overview
     */
    async getLearningOverview(enrollmentId: number | string): Promise<LearningOverview> {
        const response = await api.get<ApiResponse<LearningOverview>>(`/enrollments/${enrollmentId}/learning-overview`);
        return response.data.data;
    },

    /**
     * Get the next or last activity to continue learning.
     * GET /api/v1/enrollments/{enrollmentId}/current-activity
     */
    async getCurrentActivity(enrollmentId: number | string): Promise<any> {
        const response = await api.get<ApiResponse<any>>(`/enrollments/${enrollmentId}/current-activity`);
        return response.data.data;
    },

    /**
     * Update the learner's current/last activity.
     * POST /api/v1/enrollments/{enrollmentId}/current-activity
     */
    async updateCurrentActivity(
        enrollmentId: number | string,
        payload: UpdateActivityPayload
    ): Promise<any> {
        const response = await api.post<ApiResponse<any>>(
            `/enrollments/${enrollmentId}/current-activity`,
            payload
        );
        return response.data.data;
    },

    /**
     * Force recalculation of course progress.
     * POST /api/v1/enrollments/{enrollmentId}/recalculate-progress
     */
    async recalculateProgress(enrollmentId: number | string): Promise<any> {
        const response = await api.post<ApiResponse<any>>(
            `/enrollments/${enrollmentId}/recalculate-progress`
        );
        return response.data.data;
    },

    /**
     * Mark a material as completed within an enrollment.
     * POST /api/v1/enrollments/{enrollmentId}/materials/{materialId}/complete
     */
    async completeMaterial(
        enrollmentId: number | string,
        materialId: number | string
    ): Promise<MaterialCompletionResult> {
        const response = await api.post<ApiResponse<MaterialCompletionResult>>(
            `/enrollments/${enrollmentId}/materials/${materialId}/complete`
        );
        return response.data.data;
    },
};

export default learningService;

