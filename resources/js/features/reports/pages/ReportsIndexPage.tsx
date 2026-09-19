import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ReportsIndexPage: React.FC = () => {
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';

    // Employees are directed to their personal learning report
    // Instructors and Admins are directed to the course performance report
    const targetPath = isEmployee ? '/reports/learning' : '/reports/courses';

    return <Navigate to={targetPath} replace />;
};

export default ReportsIndexPage;
