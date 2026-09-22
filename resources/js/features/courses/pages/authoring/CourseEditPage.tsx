import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Layers,
    FileEdit,
    Activity,
    Users,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCourseDetail } from '../../hooks/useCourseDetail';
import { useCourseModules } from '../../hooks/useCourseModules';
import { useCategories } from '../../hooks/useCategories';
import { useCourses } from '../../hooks/useCourses';
import useCourseAuthoring from '../../hooks/useCourseAuthoring';
import CourseForm from '../../components/authoring/CourseForm';
import CourseStructureEditor from '../../components/authoring/CourseStructureEditor';
import CourseStatusActions from '../../components/authoring/CourseStatusActions';
import CourseInstructorsManager from '../../components/authoring/CourseInstructorsManager';
import CourseAuthoringAccessDenied from '../../components/authoring/CourseAuthoringAccessDenied';
import { Category, CourseStatus, UpdateCoursePayload } from '../../types';

type EditorTab = 'structure' | 'details' | 'lifecycle' | 'instructors';

export const CourseEditPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const isAuthorized =
        user?.role === 'SUPER_ADMIN' ||
        user?.role === 'LEARNING_ADMIN' ||
        user?.role === 'INSTRUCTOR';
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';

    const [activeTab, setActiveTab] = useState<EditorTab>('structure');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const {
        data: course,
        isLoading: isLoadingCourse,
        isError: isCourseError,
        error: courseFetchError,
    } = useCourseDetail(courseId);

    const {
        data: modules = [],
        isLoading: isLoadingModules,
    } = useCourseModules(courseId);

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
        if (course?.category) {
            catMap.set(course.category.id, course.category as Category);
        }
        (coursesData?.courses ?? []).forEach((c) => {
            if (c.category) {
                catMap.set(c.category.id, c.category as Category);
            }
        });
        if (catMap.size === 0 && adminCategories.length > 0) {
            return adminCategories;
        }
        return Array.from(catMap.values());
    }, [isAdmin, adminCategories, course?.category, coursesData]);

    const {
        updateCourse,
        isUpdatingCourse,
        updateStatus,
        isUpdatingStatus,
    } = useCourseAuthoring(courseId);

    if (!isAuthorized) {
        return <CourseAuthoringAccessDenied />;
    }

    if (isLoadingCourse) {
        return (
            <div className="max-w-5xl mx-auto py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading course editor...</p>
            </div>
        );
    }

    if (isCourseError || !course) {
        const status = (courseFetchError as any)?.response?.status;
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-foreground mb-1">
                        {status === 403 ? 'Unauthorized Access' : 'Course Not Found'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        {status === 403
                            ? 'You are not assigned to manage this course.'
                            : 'The course you requested could not be found or has been removed.'}
                    </p>
                    <Link
                        to="/admin/courses"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Course Management
                    </Link>
                </div>
            </div>
        );
    }

    const handleUpdateDetails = async (data: UpdateCoursePayload) => {
        setUpdateError(null);
        setSuccessMessage(null);
        try {
            await updateCourse({
                id: course.id,
                payload: data,
            });
            setSuccessMessage('Course details updated successfully.');
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setUpdateError(
                err.response?.data?.message || 'Failed to update course details.'
            );
        }
    };

    const handleUpdateStatus = async (newStatus: CourseStatus) => {
        setSuccessMessage(null);
        setUpdateError(null);
        try {
            await updateStatus({
                id: course.id,
                status: newStatus,
            });
            setSuccessMessage(`Course status successfully transitioned to ${newStatus}.`);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: any) {
            setUpdateError(
                err.response?.data?.message || 'Failed to transition course status.'
            );
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header and Back Link */}
            <div>
                <Link
                    to="/admin/courses"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium mb-3 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Course Management
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {course.title}
                            </h1>
                            <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${course.status === 'PUBLISHED'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        : course.status === 'ARCHIVED'
                                            ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    }`}
                            >
                                {course.status}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                            Slug: {course.slug} • Duration: {course.estimated_duration || 0} mins
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {course.status === 'PUBLISHED' && (
                            <Link
                                to={`/courses/${course.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input text-foreground text-xs font-medium hover:bg-muted transition-colors shadow-sm"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                Preview Catalog View
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Success and Error Alerts */}
            {successMessage && (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2.5 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{successMessage}</span>
                </div>
            )}

            {updateError && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5 shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{updateError}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-border space-x-1 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab('structure')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'structure'
                            ? 'border-primary text-primary font-semibold'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    Course Structure ({modules.length} Modules)
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'details'
                            ? 'border-primary text-primary font-semibold'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                        }`}
                >
                    <FileEdit className="w-4 h-4" />
                    Course Details
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('lifecycle')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'lifecycle'
                            ? 'border-primary text-primary font-semibold'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                        }`}
                >
                    <Activity className="w-4 h-4" />
                    Lifecycle & Status
                </button>

                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => setActiveTab('instructors')}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'instructors'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Instructors ({course.instructors?.length || 0})
                    </button>
                )}
            </div>

            {/* Active Tab Panel */}
            <div className="pt-2">
                {activeTab === 'structure' && (
                    <CourseStructureEditor
                        courseId={course.id}
                        modules={modules}
                        isLoading={isLoadingModules}
                    />
                )}

                {activeTab === 'details' && (
                    <div className="max-w-3xl">
                        <CourseForm
                            initialData={course}
                            categories={categories}
                            onSubmit={handleUpdateDetails as any}
                            isSubmitting={isUpdatingCourse}
                            submitButtonLabel="Save Changes"
                            errorMessage={updateError}
                        />
                    </div>
                )}

                {activeTab === 'lifecycle' && (
                    <div className="max-w-2xl">
                        <CourseStatusActions
                            currentStatus={course.status}
                            onUpdateStatus={handleUpdateStatus}
                            isUpdating={isUpdatingStatus}
                        />
                    </div>
                )}

                {activeTab === 'instructors' && isAdmin && (
                    <div className="max-w-2xl">
                        <CourseInstructorsManager
                            courseId={course.id}
                            instructors={course.instructors || []}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseEditPage;
