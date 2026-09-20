import { useQuery } from '@tanstack/react-query';
import courseService from '../services/courseService';
import { CourseFilterParams, CourseListResult } from '../types';

interface UseCoursesOptions {
    enabled?: boolean;
}

export const useCourses = (
    filters?: CourseFilterParams,
    options?: UseCoursesOptions
) => {
    return useQuery<CourseListResult, Error>({
        queryKey: ['courses', filters],
        queryFn: () => courseService.getCourses(filters),
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
        enabled: options?.enabled ?? true,
    });
};

export default useCourses;

