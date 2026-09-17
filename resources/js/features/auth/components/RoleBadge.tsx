import React from 'react';
import { RoleName } from '@/types/user';

interface RoleBadgeProps {
    role: RoleName;
    className?: string;
}

const roleConfigs: Record<RoleName, { label: string; className: string }> = {
    SUPER_ADMIN: {
        label: 'Super Admin',
        className: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    },
    LEARNING_ADMIN: {
        label: 'Learning Admin',
        className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    },
    INSTRUCTOR: {
        label: 'Instructor',
        className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    },
    EMPLOYEE: {
        label: 'Employee',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
    const config = roleConfigs[role] || {
        label: role,
        className: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
        >
            {config.label}
        </span>
    );
};

export default RoleBadge;
