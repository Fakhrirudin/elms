import api from '@/services/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import {
    Category,
    Course,
    CourseFilterParams,
    CourseListResult,
    CourseModule,
} from '../types';

export const courseService = {
    /**
     * Retrieve paginated list of courses with optional search, category, and sorting filters.
     */
    async getCourses(params?: CourseFilterParams): Promise<CourseListResult> {
        // Clean undefined or empty parameters before request
        const cleanParams: Record<string, unknown> = {};

        if (params?.page) cleanParams.page = params.page;
        if (params?.per_page) cleanParams.per_page = params.per_page;
        if (params?.search && params.search.trim() !== '') cleanParams.search = params.search.trim();
        if (params?.category_id !== undefined && params?.category_id !== '' && params?.category_id !== null) {
            cleanParams.category_id = params.category_id;
        }
        if (params?.sort_by) cleanParams.sort_by = params.sort_by;
        if (params?.sort_direction) cleanParams.sort_direction = params.sort_direction;

        const response = await api.get<PaginatedResponse<Course>>('/courses', {
            params: cleanParams,
        });

        return {
            courses: response.data.data,
            meta: response.data.meta,
        };
    },

    /**
     * Retrieve single course detail by id.
     */
    async getCourse(id: number | string): Promise<Course> {
        const response = await api.get<ApiResponse<Course>>(`/courses/${id}`);
        return response.data.data;
    },

    /**
     * Retrieve modules and syllabus for a course.
     */
    async getCourseModules(courseId: number | string): Promise<CourseModule[]> {
        const response = await api.get<ApiResponse<CourseModule[]>>(`/courses/${courseId}/modules`);
        return response.data.data;
    },

    /**
     * Retrieve list of all categories for catalog filtering.
     */
    async getCategories(): Promise<Category[]> {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data.data;
    },
};

export default courseService;

