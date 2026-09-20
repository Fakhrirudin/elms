import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { useCourses } from '../../hooks/useCourses';
import useCourseAuthoring from '../../hooks/useCourseAuthoring';
import CourseForm from '../../components/authoring/CourseForm';
import CourseAuthoringAccessDenied from '../../components/authoring/CourseAuthoringAccessDenied';
import { CreateCoursePayload, Category } from '../../types';

export const CourseCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAuthorized =
        user?.role === 'SUPER_ADMIN' ||
        user?.role === 'LEARNING_ADMIN' ||
        user?.role === 'INSTRUCTOR';
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';

    const { data: adminCategories = [] } = useCategories({
        enabled: isAdmin,
    });

    const { data: coursesData } = useCourses(
        { per_page: 50 },
        { enabled: !isAdmin }
    );

    const categories = useMemo<Category[]>(() => {
        if (isAdmin && adminCategories.length > 0) {
            return adminCategories;
        }
        const catMap = new Map<number, Category>();
        (coursesData?.courses ?? []).forEach((c) => {
            if (c.category) {
                catMap.set(c.category.id, c.category as Category);
            }
        });
        if (catMap.size === 0 && adminCategories.length > 0) {
            return adminCategories;
        }
        return Array.from(catMap.values());
    }, [isAdmin, adminCategories, coursesData]);

    const { createCourse, isCreatingCourse } = useCourseAuthoring();
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (!isAuthorized) {
        return <CourseAuthoringAccessDenied />;
    }

    const handleSubmit = async (data: CreateCoursePayload) => {
        setSubmitError(null);
        try {
            const newCourse = await createCourse(data);
            navigate(`/admin/courses/${newCourse.id}/edit`);
        } catch (err: any) {
            setSubmitError(
                err.response?.data?.message || 'Failed to create course. Please review the form inputs.'
            );
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <Link
                    to="/admin/courses"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium mb-3 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Course Management
                </Link>

                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <BookPlus className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Course</h1>
                        <p className="text-sm text-muted-foreground">
                            Fill in course details to start as a Draft. You can construct syllabus modules and materials immediately after.
                        </p>
                    </div>
                </div>
            </div>

            <CourseForm
                categories={categories}
                onSubmit={handleSubmit as any}
                isSubmitting={isCreatingCourse}
                submitButtonLabel="Create Course & Build Structure"
                errorMessage={submitError}
            />
        </div>
    );
};

export default CourseCreatePage;
