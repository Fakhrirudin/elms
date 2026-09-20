import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface CourseAuthoringAccessDeniedProps {
    title?: string;
    message?: string;
}

export const CourseAuthoringAccessDenied: React.FC<CourseAuthoringAccessDeniedProps> = ({
    title = 'Access Denied',
    message = 'You do not have permission to access course authoring and management. Course authoring is restricted to authorized Instructors and Administrators.',
}) => {
    return (
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
            <div className="bg-card border border-destructive/30 rounded-xl p-6 sm:p-8 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">{message}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Browse Course Catalog
                    </Link>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium text-sm hover:bg-muted/80 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CourseAuthoringAccessDenied;
