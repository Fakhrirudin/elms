import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, CheckCircle2, Archive, BookOpen, AlertCircle } from 'lucide-react';
import { Course, CourseStatus } from '../../types';
import { useAuth } from '@/context/AuthContext';

interface CourseManagementTableProps {
    courses: Course[];
    isLoading: boolean;
    onUpdateStatus?: (courseId: number, newStatus: CourseStatus) => void;
    isUpdatingStatus?: boolean;
}

export const CourseManagementTable: React.FC<CourseManagementTableProps> = ({
    courses,
    isLoading,
    onUpdateStatus,
    isUpdatingStatus = false,
}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';

    const getStatusBadge = (status: CourseStatus) => {
        switch (status) {
            case 'PUBLISHED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Published
                    </span>
                );
            case 'ARCHIVED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        Archived
                    </span>
                );
            case 'DRAFT':
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        Draft
                    </span>
                );
        }
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading courses...</p>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No courses found</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    No courses match your current filter criteria or you have not created any courses yet.
                </p>
                <Link
                    to="/admin/courses/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Create Your First Course
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                        <tr>
                            <th scope="col" className="px-5 py-3.5">Course</th>
                            <th scope="col" className="px-4 py-3.5">Status</th>
                            <th scope="col" className="px-4 py-3.5">Instructor</th>
                            <th scope="col" className="px-3 py-3.5 text-center">Modules</th>
                            <th scope="col" className="px-3 py-3.5 text-center">Materials</th>
                            <th scope="col" className="px-4 py-3.5">Updated</th>
                            <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {courses.map((course) => {
                            const instructorNames = course.instructors && course.instructors.length > 0
                                ? course.instructors.map((i) => i.name).join(', ')
                                : 'Unassigned';

                            return (
                                <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground hover:text-primary transition-colors">
                                                <Link to={`/admin/courses/${course.id}/edit`}>
                                                    {course.title}
                                                </Link>
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                {course.category && (
                                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                        {course.category.name}
                                                    </span>
                                                )}
                                                {course.estimated_duration && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {course.estimated_duration} mins
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {getStatusBadge(course.status)}
                                    </td>
                                    <td className="px-4 py-4 text-muted-foreground">
                                        <span className="line-clamp-1 max-w-[180px]" title={instructorNames}>
                                            {instructorNames}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 text-center font-medium text-foreground">
                                        {course.modules_count ?? 0}
                                    </td>
                                    <td className="px-3 py-4 text-center font-medium text-foreground">
                                        {course.materials_count ?? 0}
                                    </td>
                                    <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                                        {formatDate(course.updated_at)}
                                    </td>
                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center gap-2">
                                            <Link
                                                to={`/admin/courses/${course.id}/edit`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors"
                                                title="Edit course & structure"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                Edit
                                            </Link>

                                            {/* Publishing / Archiving strictly for Admins */}
                                            {isAdmin && onUpdateStatus && (
                                                <>
                                                    {course.status === 'DRAFT' && (
                                                        <button
                                                            type="button"
                                                            disabled={isUpdatingStatus}
                                                            onClick={() => onUpdateStatus(course.id, 'PUBLISHED')}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                                                            title="Publish course to catalog"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Publish
                                                        </button>
                                                    )}

                                                    {course.status === 'PUBLISHED' && (
                                                        <button
                                                            type="button"
                                                            disabled={isUpdatingStatus}
                                                            onClick={() => onUpdateStatus(course.id, 'ARCHIVED')}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                                            title="Archive course"
                                                        >
                                                            <Archive className="w-3.5 h-3.5" />
                                                            Archive
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseManagementTable;
