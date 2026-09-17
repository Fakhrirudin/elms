import { useQuery } from '@tanstack/react-query';
import courseService from '../services/courseService';
import { CourseModule } from '../types';

export const useCourseModules = (courseId: number | string | undefined) => {
    return useQuery<CourseModule[], Error>({
        queryKey: ['course-modules', courseId ? String(courseId) : ''],
        queryFn: () => {
            if (!courseId) throw new Error('Course ID is required');
            return courseService.getCourseModules(courseId);
        },
        enabled: Boolean(courseId),
        staleTime: 60 * 1000,
    });
};

export default useCourseModules;

