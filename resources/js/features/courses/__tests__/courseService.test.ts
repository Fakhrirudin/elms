import { describe, it, expect, beforeEach, vi } from 'vitest';
import courseService from '../services/courseService';
import api from '@/services/api';

vi.mock('@/services/api', () => ({
    default: {
        get: vi.fn(),
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
                sort_by: 'title',
                sort_direction: 'asc',
            });

            expect(api.get).toHaveBeenCalledWith('/courses', {
                params: {
                    page: 2,
                    per_page: 5,
                    search: 'Diplomacy',
                    category_id: 3,
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

