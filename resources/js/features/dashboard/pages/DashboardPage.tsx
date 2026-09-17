import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import useDashboard from '../hooks/useDashboard';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSkeleton from '../components/DashboardSkeleton';
import DashboardError from '../components/DashboardError';
import EmployeeDashboard from '../components/EmployeeDashboard';
import InstructorDashboard from '../components/InstructorDashboard';
import AdminDashboard from '../components/AdminDashboard';
import {
    EmployeeDashboardData,
    InstructorDashboardData,
    AdminDashboardData,
    isEmployeeDashboard,
    isInstructorDashboard,
    isAdminDashboard,
} from '../types';

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { data, isLoading, isError, error, refetch, isFetching } = useDashboard();

    if (!user) {
        return null;
    }

    const renderContent = () => {
        if (isLoading) {
            const cardCount = user.role === 'SUPER_ADMIN' || user.role === 'LEARNING_ADMIN' ? 6 : 4;
            return <DashboardSkeleton cardCount={cardCount} />;
        }

        if (isError || !data) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Unable to retrieve dashboard metrics from the server.';
            return (
                <DashboardError
                    message={errorMessage}
                    onRetry={() => void refetch()}
                    isRetrying={isFetching}
                />
            );
        }

        // Role-based view narrowing
        if (user.role === 'EMPLOYEE') {
            if (isEmployeeDashboard(data, user.role)) {
                return <EmployeeDashboard data={data} />;
            }
            return <EmployeeDashboard data={data as unknown as EmployeeDashboardData} />;
        }

        if (user.role === 'INSTRUCTOR') {
            if (isInstructorDashboard(data, user.role)) {
                return <InstructorDashboard data={data} />;
            }
            return <InstructorDashboard data={data as unknown as InstructorDashboardData} />;
        }

        if (user.role === 'SUPER_ADMIN' || user.role === 'LEARNING_ADMIN') {
            if (isAdminDashboard(data, user.role)) {
                return <AdminDashboard data={data} />;
            }
            return <AdminDashboard data={data as unknown as AdminDashboardData} />;
        }

        // Fallback for unrecognized role without crashing
        return (
            <div className="p-6 rounded-lg border border-border bg-card text-center text-muted-foreground text-sm">
                No customized dashboard view configured for role: {user.role}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <DashboardHeader user={user} />
            {renderContent()}
        </div>
    );
};

export default DashboardPage;

