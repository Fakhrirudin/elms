import { describe, it, expect, beforeEach, vi } from 'vitest';
import courseService from '../services/courseService';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('courseService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCourses', () => {
        it('calls GET /courses without params and returns courses with meta', async () => {
            const mockCourses = [
                { id: 1, title: 'Course 1', slug: 'course-1', status: 'PUBLISHED' },
            ];
            const mockMeta = { current_page: 1, per_page: 10, total: 1, last_page: 1 };

            (api.get as any).mockResolvedValueOnce({
                data: {
                    success: true,
                    message: 'Courses retrieved successfully',
                    data: mockCourses,
                    meta: mockMeta,
                },
            });

            const result = await courseService.getCourses();

            expect(api.get).toHaveBeenCalledWith('/courses', { params: {} });
            expect(result).toEqual({ courses: mockCourses, meta: mockMeta });
        });

        it('correctly maps query parameters and ignores empty strings/nulls', async () => {
            const mockCourses = [
                { id: 2, title: 'Filtered Course', slug: 'filtered-course', status: 'PUBLISHED' },
            ];
            const mockMeta = { current_page: 2, per_page: 5, total: 10, last_page: 2 };

            (api.get as any).mockResolvedValueOnce({
                data: {
                    success: true,
                    message: 'Courses retrieved successfully',
                    data: mockCourses,
                    meta: mockMeta,
                },
            });

            const result = await courseService.getCourses({
                page: 2,
                per_page: 5,
                search: '  Diplomacy  ',
                category_id: 3,
                status: 'DRAFT',
                instructor_id: 4,
                sort_by: 'title',
                sort_direction: 'asc',
            });

            expect(api.get).toHaveBeenCalledWith('/courses', {
                params: {
                    page: 2,
                    per_page: 5,
                    search: 'Diplomacy',
                    category_id: 3,
                    status: 'DRAFT',
                    instructor_id: 4,
                    sort_by: 'title',
                    sort_direction: 'asc',
                },
            });
            expect(result.courses).toEqual(mockCourses);
            expect(result.meta).toEqual(mockMeta);
        });

        it('propagates network or API errors', async () => {
            (api.get as any).mockRejectedValueOnce(new Error('Network Error'));

            await expect(courseService.getCourses()).rejects.toThrow('Network Error');
        });
    });

    describe('getCourse', () => {
        it('calls GET /courses/{id} and returns course detail', async () => {
            const mockCourse = {
                id: 10,
                title: 'Diplomatic Protocol',
                slug: 'diplomatic-protocol',
                status: 'PUBLISHED',
                category: { id: 1, name: 'Diplomacy' },
                instructors: [{ id: 5, name: 'Ambassador John' }],
            };

            (api.get as any).mockResolvedValueOnce({
                data: {
                    success: true,
                    message: 'Course retrieved successfully',
                    data: mockCourse,
                },
            });

            const result = await courseService.getCourse(10);

            expect(api.get).toHaveBeenCalledWith('/courses/10');
            expect(result).toEqual(mockCourse);
        });

        it('propagates error when course is not found', async () => {
            (api.get as any).mockRejectedValueOnce(new Error('Course not found'));

            await expect(courseService.getCourse(999)).rejects.toThrow('Course not found');
        });
    });

    describe('createCourse', () => {
        it('calls POST /courses with payload and returns created course', async () => {
            const payload = {
                title: 'New Course',
                category_id: 1,
                estimated_duration: 120,
            };
            const mockCreated = { id: 25, ...payload, status: 'DRAFT' };

            (api.post as any).mockResolvedValueOnce({
                data: { success: true, data: mockCreated },
            });

            const result = await courseService.createCourse(payload);

            expect(api.post).toHaveBeenCalledWith('/courses', payload);
            expect(result).toEqual(mockCreated);
        });
    });

    describe('updateCourse', () => {
        it('calls PUT /courses/{id} and returns updated course', async () => {
            const payload = { title: 'Updated Title' };
            const mockUpdated = { id: 25, title: 'Updated Title' };

            (api.put as any).mockResolvedValueOnce({
                data: { success: true, data: mockUpdated },
            });

            const result = await courseService.updateCourse(25, payload);

            expect(api.put).toHaveBeenCalledWith('/courses/25', payload);
            expect(result).toEqual(mockUpdated);
        });
    });

    describe('updateCourseStatus', () => {
        it('calls PATCH /courses/{id}/status with status payload', async () => {
            const mockUpdated = { id: 25, status: 'PUBLISHED' };

            (api.patch as any).mockResolvedValueOnce({
                data: { success: true, data: mockUpdated },
            });

            const result = await courseService.updateCourseStatus(25, 'PUBLISHED');

            expect(api.patch).toHaveBeenCalledWith('/courses/25/status', { status: 'PUBLISHED' });
            expect(result).toEqual(mockUpdated);
        });
    });

    describe('deleteCourse', () => {
        it('calls DELETE /courses/{id}', async () => {
            (api.delete as any).mockResolvedValueOnce({
                data: { success: true },
            });

            await courseService.deleteCourse(25);

            expect(api.delete).toHaveBeenCalledWith('/courses/25');
        });
    });

    describe('getCourseModules', () => {
        it('calls GET /courses/{id}/modules and returns module syllabus', async () => {
            const mockModules = [
                {
                    id: 101,
                    course_id: 10,
                    title: 'Module 1: Foundations',
                    sort_order: 1,
                    materials: [
                        { id: 201, title: 'Introduction', type: 'TEXT', is_mandatory: true },
                    ],
                },
            ];

            (api.get as any).mockResolvedValueOnce({
                data: {
                    success: true,
                    message: 'Modules retrieved successfully',
                    data: mockModules,
                },
            });

            const result = await courseService.getCourseModules(10);

            expect(api.get).toHaveBeenCalledWith('/courses/10/modules');
            expect(result).toEqual(mockModules);
        });
    });

    describe('module CRUD', () => {
        it('calls POST /courses/{id}/modules for createModule', async () => {
            const payload = { title: 'New Module', sort_order: 1 };
            const mockCreated = { id: 101, course_id: 10, ...payload };

            (api.post as any).mockResolvedValueOnce({
                data: { success: true, data: mockCreated },
            });

            const result = await courseService.createModule(10, payload);

            expect(api.post).toHaveBeenCalledWith('/courses/10/modules', payload);
            expect(result).toEqual(mockCreated);
        });

        it('calls PUT /modules/{id} for updateModule', async () => {
            const payload = { title: 'Updated Module' };
            const mockUpdated = { id: 101, title: 'Updated Module' };

            (api.put as any).mockResolvedValueOnce({
                data: { success: true, data: mockUpdated },
            });

            const result = await courseService.updateModule(101, payload);

            expect(api.put).toHaveBeenCalledWith('/modules/101', payload);
            expect(result).toEqual(mockUpdated);
        });

        it('calls DELETE /modules/{id} for deleteModule', async () => {
            (api.delete as any).mockResolvedValueOnce({ data: { success: true } });

            await courseService.deleteModule(101);

            expect(api.delete).toHaveBeenCalledWith('/modules/101');
        });
    });

    describe('material CRUD', () => {
        it('calls POST /modules/{id}/materials for createMaterial', async () => {
            const payload = { title: 'Lesson 1', type: 'TEXT' as const, content: 'Hello' };
            const mockCreated = { id: 201, module_id: 101, ...payload };

            (api.post as any).mockResolvedValueOnce({
                data: { success: true, data: mockCreated },
            });

            const result = await courseService.createMaterial(101, payload);

            expect(api.post).toHaveBeenCalledWith('/modules/101/materials', payload);
            expect(result).toEqual(mockCreated);
        });

        it('calls PUT /materials/{id} for updateMaterial', async () => {
            const payload = { title: 'Updated Lesson' };
            const mockUpdated = { id: 201, title: 'Updated Lesson' };

            (api.put as any).mockResolvedValueOnce({
                data: { success: true, data: mockUpdated },
            });

            const result = await courseService.updateMaterial(201, payload);

            expect(api.put).toHaveBeenCalledWith('/materials/201', payload);
            expect(result).toEqual(mockUpdated);
        });

        it('calls DELETE /materials/{id} for deleteMaterial', async () => {
            (api.delete as any).mockResolvedValueOnce({ data: { success: true } });

            await courseService.deleteMaterial(201);

            expect(api.delete).toHaveBeenCalledWith('/materials/201');
        });
    });

    describe('instructor management', () => {
        it('calls GET /courses/{id}/instructors for getCourseInstructors', async () => {
            const mockInstructors = [{ id: 5, name: 'Instructor John', email: 'john@elms.test' }];
            (api.get as any).mockResolvedValueOnce({
                data: { success: true, data: mockInstructors },
            });

            const result = await courseService.getCourseInstructors(10);

            expect(api.get).toHaveBeenCalledWith('/courses/10/instructors');
            expect(result).toEqual(mockInstructors);
        });

        it('calls POST /courses/{id}/instructors for assignInstructor', async () => {
            (api.post as any).mockResolvedValueOnce({
                data: { success: true, data: [{ id: 5 }] },
            });

            await courseService.assignInstructor(10, 5);

            expect(api.post).toHaveBeenCalledWith('/courses/10/instructors', { user_id: 5 });
        });

        it('calls DELETE /courses/{id}/instructors/{userId} for removeInstructor', async () => {
            (api.delete as any).mockResolvedValueOnce({
                data: { success: true, data: [] },
            });

            await courseService.removeInstructor(10, 5);

            expect(api.delete).toHaveBeenCalledWith('/courses/10/instructors/5');
        });

        it('calls GET /users with role=INSTRUCTOR for getInstructorCandidates', async () => {
            const mockCandidates = [{ id: 5, name: 'Instructor John', email: 'john@elms.test' }];
            (api.get as any).mockResolvedValueOnce({
                data: { success: true, data: mockCandidates },
            });

            const result = await courseService.getInstructorCandidates();

            expect(api.get).toHaveBeenCalledWith('/users', {
                params: { role: 'INSTRUCTOR', per_page: 100 },
            });
            expect(result).toEqual(mockCandidates);
        });
    });

    describe('getCategories', () => {
        it('calls GET /categories and returns categories list', async () => {
            const mockCategories = [
                { id: 1, name: 'Diplomacy', slug: 'diplomacy' },
                { id: 2, name: 'Information Technology', slug: 'it' },
            ];

            (api.get as any).mockResolvedValueOnce({
                data: {
                    success: true,
                    message: 'Categories retrieved successfully',
                    data: mockCategories,
                },
            });

            const result = await courseService.getCategories();

            expect(api.get).toHaveBeenCalledWith('/categories');
            expect(result).toEqual(mockCategories);
        });
    });
});

