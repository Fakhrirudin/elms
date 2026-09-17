import { useQuery } from '@tanstack/react-query';
import courseService from '../services/courseService';
import { Course } from '../types';

export const useCourseDetail = (courseId: number | string | undefined) => {
    return useQuery<Course, Error>({
        queryKey: ['course', courseId ? String(courseId) : ''],
        queryFn: () => {
            if (!courseId) throw new Error('Course ID is required');
            return courseService.getCourse(courseId);
        },
        enabled: Boolean(courseId),
        staleTime: 60 * 1000,
    });
};

export default useCourseDetail;

