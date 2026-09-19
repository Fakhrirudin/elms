import api from '@/services/api';
import { PaginatedResponse } from '@/types/api';
import {
    CourseReportItem,
    CourseReportParams,
    CourseReportResult,
    LearningReportItem,
    LearningReportParams,
    LearningReportResult,
    QuizReportItem,
    QuizReportParams,
    QuizReportResult,
} from '../types';

export const reportService = {
    /**
     * Retrieve paginated course performance report.
     * GET /api/v1/reports/courses
     * Authorized: SUPER_ADMIN, LEARNING_ADMIN, INSTRUCTOR (scoped to assigned courses)
     */
    async getCourseReport(params?: CourseReportParams): Promise<CourseReportResult> {
        const cleanParams: Record<string, unknown> = {};

        if (params?.page) cleanParams.page = params.page;
        if (params?.per_page) cleanParams.per_page = params.per_page;
        if (params?.course_id) cleanParams.course_id = params.course_id;
        if (params?.category_id) cleanParams.category_id = params.category_id;
        if (params?.status) cleanParams.status = params.status;

        const response = await api.get<PaginatedResponse<CourseReportItem>>('/reports/courses', {
            params: cleanParams,
        });

        return {
            items: response.data.data,
            meta: response.data.meta,
        };
    },

    /**
     * Retrieve paginated learner progress report.
     * GET /api/v1/reports/learning
     * Authorized: All authenticated roles (EMPLOYEE strictly scoped to own records)
     */
    async getLearningReport(params?: LearningReportParams): Promise<LearningReportResult> {
        const cleanParams: Record<string, unknown> = {};

        if (params?.page) cleanParams.page = params.page;
        if (params?.per_page) cleanParams.per_page = params.per_page;
        if (params?.course_id) cleanParams.course_id = params.course_id;
        if (params?.department_id) cleanParams.department_id = params.department_id;
        if (params?.status) cleanParams.status = params.status;
        if (params?.user_id) cleanParams.user_id = params.user_id;

        const response = await api.get<PaginatedResponse<LearningReportItem>>('/reports/learning', {
            params: cleanParams,
        });

        return {
            items: response.data.data,
            meta: response.data.meta,
        };
    },

    /**
     * Retrieve paginated quiz performance report.
     * GET /api/v1/reports/quiz
     * Authorized: SUPER_ADMIN, LEARNING_ADMIN, INSTRUCTOR (scoped to assigned courses)
     */
    async getQuizReport(params?: QuizReportParams): Promise<QuizReportResult> {
        const cleanParams: Record<string, unknown> = {};

        if (params?.page) cleanParams.page = params.page;
        if (params?.per_page) cleanParams.per_page = params.per_page;
        if (params?.quiz_id) cleanParams.quiz_id = params.quiz_id;
        if (params?.course_id) cleanParams.course_id = params.course_id;

        const response = await api.get<PaginatedResponse<QuizReportItem>>('/reports/quiz', {
            params: cleanParams,
        });

        return {
            items: response.data.data,
            meta: response.data.meta,
        };
    },
};

export default reportService;
