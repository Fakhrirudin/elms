export type RoleName = 'SUPER_ADMIN' | 'LEARNING_ADMIN' | 'INSTRUCTOR' | 'EMPLOYEE';

export interface DepartmentSummary {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    nip?: string | null;
    avatar?: string;
    email_verified_at?: string | null;
    role: RoleName;
    department?: DepartmentSummary | null;
    [key: string]: unknown;
}
