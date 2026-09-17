import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EnrollmentStatus } from '../types';

interface EnrollmentStatusBadgeProps {
    status: EnrollmentStatus;
    className?: string;
}

export const EnrollmentStatusBadge: React.FC<EnrollmentStatusBadgeProps> = ({ status, className = '' }) => {
    switch (status) {
        case 'ENROLLED':
            return (
                <Badge
                    variant="outline"
                    className={`border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[11px] font-medium tracking-wide uppercase ${className}`}
                >
                    Enrolled
                </Badge>
            );
        case 'IN_PROGRESS':
            return (
                <Badge
                    variant="outline"
                    className={`border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-medium tracking-wide uppercase ${className}`}
                >
                    In Progress
                </Badge>
            );
        case 'COMPLETED':
            return (
                <Badge
                    variant="outline"
                    className={`border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium tracking-wide uppercase ${className}`}
                >
                    Completed
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className={`text-[11px] font-medium uppercase ${className}`}>
                    {status}
                </Badge>
            );
    }
};

export default EnrollmentStatusBadge;

