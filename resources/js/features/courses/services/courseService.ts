import api from '@/services/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import {
    Category,
    Course,
    CourseFilterParams,
    CourseListResult,
    CourseModule,
    Material,
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
        if (params?.status) cleanParams.status = params.status;
        if (params?.instructor_id) cleanParams.instructor_id = params.instructor_id;
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
     * Create a new course (initial status DRAFT).
     */
    async createCourse(payload: import('../types').CreateCoursePayload): Promise<Course> {
        const response = await api.post<ApiResponse<Course>>('/courses', payload);
        return response.data.data;
    },

    /**
     * Update course metadata.
     */
    async updateCourse(id: number | string, payload: import('../types').UpdateCoursePayload): Promise<Course> {
        const response = await api.put<ApiResponse<Course>>(`/courses/${id}`, payload);
        return response.data.data;
    },

    /**
     * Update course lifecycle status (DRAFT -> PUBLISHED -> ARCHIVED).
     */
    async updateCourseStatus(id: number | string, status: import('../types').CourseStatus): Promise<Course> {
        const response = await api.patch<ApiResponse<Course>>(`/courses/${id}/status`, { status });
        return response.data.data;
    },

    /**
     * Delete course (admin only).
     */
    async deleteCourse(id: number | string): Promise<void> {
        await api.delete(`/courses/${id}`);
    },

    /**
     * Retrieve modules and syllabus for a course.
     */
    async getCourseModules(courseId: number | string): Promise<CourseModule[]> {
        const response = await api.get<ApiResponse<CourseModule[]>>(`/courses/${courseId}/modules`);
        return response.data.data;
    },

    /**
     * Create a module in a course.
     */
    async createModule(courseId: number | string, payload: import('../types').CreateModulePayload): Promise<CourseModule> {
        const response = await api.post<ApiResponse<CourseModule>>(`/courses/${courseId}/modules`, payload);
        return response.data.data;
    },

    /**
     * Update module title or description.
     */
    async updateModule(moduleId: number | string, payload: import('../types').UpdateModulePayload): Promise<CourseModule> {
        const response = await api.put<ApiResponse<CourseModule>>(`/modules/${moduleId}`, payload);
        return response.data.data;
    },

    /**
     * Delete a module.
     */
    async deleteModule(moduleId: number | string): Promise<void> {
        await api.delete(`/modules/${moduleId}`);
    },

    /**
     * Create a material in a module.
     */
    async createMaterial(moduleId: number | string, payload: import('../types').CreateMaterialPayload): Promise<Material> {
        const response = await api.post<ApiResponse<Material>>(`/modules/${moduleId}/materials`, payload);
        return response.data.data;
    },

    /**
     * Update a material.
     */
    async updateMaterial(materialId: number | string, payload: import('../types').UpdateMaterialPayload): Promise<Material> {
        const response = await api.put<ApiResponse<Material>>(`/materials/${materialId}`, payload);
        return response.data.data;
    },

    /**
     * Delete a material.
     */
    async deleteMaterial(materialId: number | string): Promise<void> {
        await api.delete(`/materials/${materialId}`);
    },

    /**
     * Retrieve instructors assigned to a course.
     */
    async getCourseInstructors(courseId: number | string): Promise<import('../types').CourseInstructor[]> {
        const response = await api.get<ApiResponse<import('../types').CourseInstructor[]>>(`/courses/${courseId}/instructors`);
        return response.data.data;
    },

    /**
     * Assign an instructor to a course (admin only).
     */
    async assignInstructor(courseId: number | string, userId: number): Promise<import('../types').CourseInstructor[]> {
        const response = await api.post<ApiResponse<import('../types').CourseInstructor[]>>(`/courses/${courseId}/instructors`, {
            user_id: userId,
        });
        return response.data.data;
    },

    /**
     * Remove an assigned instructor from a course (admin only).
     */
    async removeInstructor(courseId: number | string, userId: number): Promise<import('../types').CourseInstructor[]> {
        const response = await api.delete<ApiResponse<import('../types').CourseInstructor[]>>(`/courses/${courseId}/instructors/${userId}`);
        return response.data.data;
    },

    /**
     * Retrieve list of potential instructor candidates (admin only).
     */
    async getInstructorCandidates(): Promise<import('../types').InstructorCandidate[]> {
        const response = await api.get<PaginatedResponse<import('../types').InstructorCandidate>>('/users', {
            params: { role: 'INSTRUCTOR', per_page: 100 },
        });
        return response.data.data;
    },

    /**
     * Retrieve list of all categories for catalog filtering and course creation.
     */
    async getCategories(): Promise<Category[]> {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data.data;
    },
};

export default courseService;

