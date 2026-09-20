import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const CourseManagementHeader: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Management</h1>
                    <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${isAdmin
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                    >
                        {isAdmin ? 'Administrator Scope' : 'Assigned Courses'}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {isAdmin
                        ? 'Manage, publish, structure, and assign instructors across all organizational courses.'
                        : 'Create and manage your assigned courses, syllabus modules, and learning materials.'}
                </p>
            </div>

            <Link
                to="/admin/courses/create"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
            >
                <PlusCircle className="w-4 h-4" />
                Create Course
            </Link>
        </div>
    );
};

export default CourseManagementHeader;
