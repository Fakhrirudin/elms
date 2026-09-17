import React from 'react';
import { User } from '@/types/user';
import RoleBadge from '@/features/auth/components/RoleBadge';
import { Calendar, Building } from 'lucide-react';

interface DashboardHeaderProps {
    user: User;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
    // Current date for presentation/contextual UI display only
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border">
            <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Welcome back, {user.name}!
                    </h1>
                    <RoleBadge role={user.role} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground pt-0.5">
                    {user.department && (
                        <span className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5" />
                            {user.department.name}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;

