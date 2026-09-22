import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCourses } from '../../hooks/useCourses';
import { useCategories } from '../../hooks/useCategories';
import useCourseAuthoring from '../../hooks/useCourseAuthoring';
import courseService from '../../services/courseService';
import CourseManagementHeader from '../../components/authoring/CourseManagementHeader';
import CourseManagementFilters from '../../components/authoring/CourseManagementFilters';
import CourseManagementTable from '../../components/authoring/CourseManagementTable';
import CoursePagination from '../../components/CoursePagination';
import CourseAuthoringAccessDenied from '../../components/authoring/CourseAuthoringAccessDenied';
import { Category, CourseStatus, InstructorCandidate } from '../../types';

export const CourseManagementPage: React.FC = () => {
    const { user } = useAuth();
    const isAuthorized =
        user?.role === 'SUPER_ADMIN' ||
        user?.role === 'LEARNING_ADMIN' ||
        user?.role === 'INSTRUCTOR';
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';

    // Filters state
    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [categoryId, setCategoryId] = useState<string | number>('');
    const [instructorId, setInstructorId] = useState<string | number>('');
    const [instructorsList, setInstructorsList] = useState<InstructorCandidate[]>([]);

    // Fetch categories for filter dropdown
    const { data: adminCategories = [] } = useCategories({
        enabled: isAdmin,
    });

    // Fetch instructor candidates for filter dropdown (Admin only)
    useEffect(() => {
        if (!isAdmin) return;
        let isMounted = true;
        courseService
            .getInstructorCandidates()
            .then((data) => {
                if (isMounted) setInstructorsList(data);
            })
            .catch(() => { });
        return () => {
            isMounted = false;
        };
    }, [isAdmin]);

    // Fetch courses with authoring filters
    const { data, isLoading } = useCourses({
        page,
        per_page: 10,
        search,
        status: status || undefined,
        category_id: categoryId || undefined,
        instructor_id: instructorId || undefined,
    });

    const categories = useMemo<Category[]>(() => {
        if (isAdmin && adminCategories.length > 0) {
            return adminCategories;
        }
        const catMap = new Map<number, Category>();
        (data?.courses ?? []).forEach((c) => {
            if (c.category) {
                catMap.set(c.category.id, c.category as Category);
            }
        });
        if (catMap.size === 0 && adminCategories.length > 0) {
            return adminCategories;
        }
        return Array.from(catMap.values());
    }, [isAdmin, adminCategories, data?.courses]);

    const { updateStatus, isUpdatingStatus } = useCourseAuthoring();

    if (!isAuthorized) {
        return <CourseAuthoringAccessDenied />;
    }

    const handleResetFilters = () => {
        setSearch('');
        setStatus('');
        setCategoryId('');
        setInstructorId('');
        setPage(1);
    };

    const handleUpdateStatus = async (courseId: number, newStatus: CourseStatus) => {
        try {
            await updateStatus({ id: courseId, status: newStatus });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update course status.');
        }
    };

    return (
        <div className="space-y-6">
            <CourseManagementHeader />

            <CourseManagementFilters
                search={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                }}
                status={status}
                onStatusChange={(val) => {
                    setStatus(val);
                    setPage(1);
                }}
                categoryId={categoryId}
                onCategoryChange={(val) => {
                    setCategoryId(val);
                    setPage(1);
                }}
                instructorId={instructorId}
                onInstructorChange={(val) => {
                    setInstructorId(val);
                    setPage(1);
                }}
                categories={categories}
                instructors={instructorsList}
                showInstructorFilter={isAdmin}
                onReset={handleResetFilters}
            />

            <CourseManagementTable
                courses={data?.courses || []}
                isLoading={isLoading}
                onUpdateStatus={handleUpdateStatus}
                isUpdatingStatus={isUpdatingStatus}
            />

            {data?.meta && data.meta.last_page > 1 && (
                <div className="flex justify-center pt-2">
                    <CoursePagination
                        meta={data.meta}
                        onPageChange={setPage}
                        isFetching={isLoading}
                    />
                </div>
            )}
        </div>
    );
};

export default CourseManagementPage;
