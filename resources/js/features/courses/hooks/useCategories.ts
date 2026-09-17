import { useQuery } from '@tanstack/react-query';
import courseService from '../services/courseService';
import { Category } from '../types';

interface UseCategoriesOptions {
    enabled?: boolean;
}

export const useCategories = (options?: UseCategoriesOptions) => {
    return useQuery<Category[], Error>({
        queryKey: ['categories'],
        queryFn: () => courseService.getCategories(),
        enabled: options?.enabled ?? true,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error: any) => {
            if (error?.response?.status === 403) return false;
            return failureCount < 1;
        },
    });
};

export default useCategories;
