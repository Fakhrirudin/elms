import { useQuery } from '@tanstack/react-query';
import courseService from '../services/courseService';
import { CourseFilterParams, CourseListResult } from '../types';

export const useCourses = (filters?: CourseFilterParams) => {
    return useQuery<CourseListResult, Error>({
        queryKey: ['courses', filters],
        queryFn: () => courseService.getCourses(filters),
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
};

export default useCourses;

