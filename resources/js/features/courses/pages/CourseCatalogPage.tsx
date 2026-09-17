import React, { useState, useMemo } from 'react';
import { Category, CourseFilterParams, CourseSortBy, CourseSortDirection, CourseSortOption } from '../types';
import { useCourses } from '../hooks/useCourses';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import CourseFilter from '../components/CourseFilter';
import CourseGrid from '../components/CourseGrid';
import CourseSkeleton from '../components/CourseSkeleton';
import CoursePagination from '../components/CoursePagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, SearchX, AlertCircle, RefreshCw } from 'lucide-react';

export const CourseCatalogPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';

    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>('');
    const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
    const [sortOption, setSortOption] = useState<CourseSortOption>('newest');

    // Convert sort option to backend sort_by and sort_direction
    const sortConfig = useMemo<{ sort_by: CourseSortBy; sort_direction: CourseSortDirection }>(() => {
        switch (sortOption) {
            case 'title_asc':
                return { sort_by: 'title', sort_direction: 'asc' };
            case 'title_desc':
                return { sort_by: 'title', sort_direction: 'desc' };
            case 'recently_published':
                return { sort_by: 'published_at', sort_direction: 'desc' };
            case 'newest':
            default:
                return { sort_by: 'created_at', sort_direction: 'desc' };
        }
    }, [sortOption]);

    // Build filter query params
    const filterParams = useMemo<CourseFilterParams>(() => {
        return {
            page,
            per_page: 12,
            search: search.trim() ? search.trim() : undefined,
            category_id: categoryId,
            sort_by: sortConfig.sort_by,
            sort_direction: sortConfig.sort_direction,
        };
    }, [page, search, categoryId, sortConfig]);

    // Fetch categories (for admins) and courses
    const { data: fetchedCategories = [], isLoading: isLoadingCategories } = useCategories({
        enabled: isAdmin,
    });
    const { data, isLoading, isError, error, refetch, isFetching } = useCourses(filterParams);

    // Provide categories: fetched from API for admins, or extracted from visible courses for others
    const categories = useMemo<Category[]>(() => {
        if (isAdmin && fetchedCategories.length > 0) {
            return fetchedCategories;
        }

        const categoryMap = new Map<number, Category>();
        data?.courses.forEach((course) => {
            if (course.category && !categoryMap.has(course.category.id)) {
                categoryMap.set(course.category.id, {
                    id: course.category.id,
                    name: course.category.name,
                    slug: String(course.category.id),
                });
            }
        });

        return Array.from(categoryMap.values());
    }, [isAdmin, fetchedCategories, data?.courses]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPage(1);
    };

    const handleCategoryChange = (catId: number | undefined) => {
        setCategoryId(catId);
        setPage(1);
    };

    const handleSortChange = (sort: CourseSortOption) => {
        setSortOption(sort);
        setPage(1);
    };

    const handleResetFilters = () => {
        setSearch('');
        setCategoryId(undefined);
        setSortOption('newest');
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hasActiveFilters = Boolean(search || categoryId || sortOption !== 'newest');

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Catalog Hero Header */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-medium text-xs tracking-wider uppercase">
                    <BookOpen className="h-4 w-4" />
                    <span>Learning Catalog</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Available Courses
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                    Discover structured training programs, professional skills courses, and certified learning paths.
                </p>
            </div>

            {/* Filter & Search Bar */}
            <CourseFilter
                search={search}
                categoryId={categoryId}
                sortOption={sortOption}
                categories={categories}
                isLoadingCategories={isLoadingCategories}
                onSearchChange={handleSearchChange}
                onCategoryChange={handleCategoryChange}
                onSortChange={handleSortChange}
                onReset={handleResetFilters}
            />

            {/* Main Content: Loading, Error, Empty, or Grid */}
            {isLoading ? (
                <CourseSkeleton count={8} />
            ) : isError ? (
                /* Error State */
                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                Failed to Load Courses
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {error?.message || 'An unexpected error occurred while fetching the course catalog.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-1.5 text-xs font-medium"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Retry Request</span>
                        </Button>
                    </CardContent>
                </Card>
            ) : data && data.courses.length === 0 ? (
                /* Empty Results State */
                <Card className="border-dashed border-2 border-border bg-card/40 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            {hasActiveFilters ? (
                                <SearchX className="h-6 w-6" />
                            ) : (
                                <BookOpen className="h-6 w-6" />
                            )}
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                {hasActiveFilters ? 'No Matching Courses Found' : 'No Courses Available'}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {hasActiveFilters
                                    ? 'We could not find any courses matching your search keyword or selected category. Try resetting your filters.'
                                    : 'There are currently no published courses available in the learning catalog.'}
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilters}
                                className="text-xs"
                            >
                                Reset All Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : data ? (
                /* Course Grid & Pagination */
                <div className="space-y-8">
                    <CourseGrid courses={data.courses} />
                    <CoursePagination
                        meta={data.meta}
                        onPageChange={handlePageChange}
                        isFetching={isFetching}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default CourseCatalogPage;
