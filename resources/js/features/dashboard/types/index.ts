import { RoleName } from '@/types/user';

export interface EmployeeDashboardData {
    total_courses: number;
    in_progress: number;
    completed: number;
    certificates: number;
}

export interface InstructorDashboardData {
    assigned_courses: number;
    total_enrollments: number;
    completed_courses: number;
    average_quiz_score: number;
}

export interface AdminDashboardData {
    total_employees: number;
    total_courses: number;
    published_courses: number;
    total_enrollments: number;
    completed_courses: number;
    average_quiz_score: number;
}

export type DashboardData =
    | EmployeeDashboardData
    | InstructorDashboardData
    | AdminDashboardData;

export const isEmployeeDashboard = (
    data: unknown,
    role: RoleName
): data is EmployeeDashboardData => {
    return (
        role === 'EMPLOYEE' &&
        typeof data === 'object' &&
        data !== null &&
        'total_courses' in data &&
        'in_progress' in data &&
        'completed' in data &&
        'certificates' in data
    );
};

export const isInstructorDashboard = (
    data: unknown,
    role: RoleName
): data is InstructorDashboardData => {
    return (
        role === 'INSTRUCTOR' &&
        typeof data === 'object' &&
        data !== null &&
        'assigned_courses' in data &&
        'total_enrollments' in data &&
        'completed_courses' in data &&
        'average_quiz_score' in data
    );
};

export const isAdminDashboard = (
    data: unknown,
    role: RoleName
): data is AdminDashboardData => {
    return (
        (role === 'SUPER_ADMIN' || role === 'LEARNING_ADMIN') &&
        typeof data === 'object' &&
        data !== null &&
        'total_employees' in data &&
        'total_courses' in data &&
        'published_courses' in data &&
        'total_enrollments' in data &&
        'completed_courses' in data &&
        'average_quiz_score' in data
    );
};

