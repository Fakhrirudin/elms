import { Course } from '@/features/courses/types';
import { PaginationMeta } from '@/types/api';

export type EnrollmentStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Enrollment {
    id: number;
    user_id: number;
    course_id: number;
    status: EnrollmentStatus;
    enrolled_at: string;
    completed_at?: string | null;
    course?: Course;
    created_at?: string;
    updated_at?: string;
}

export interface LearningProgress {
    enrollment_id: number;
    course_id: number;
    status: EnrollmentStatus;
    progress: number;
    total_mandatory_materials: number;
    completed_mandatory_materials: number;
}

export interface MaterialCompletionResult {
    material_id: number;
    completed_at: string;
    progress: number;
}

export interface MyCoursesParams {
    page?: number;
    per_page?: number;
    status?: EnrollmentStatus;
}

export interface MyCoursesResult {
    enrollments: Enrollment[];
    meta: PaginationMeta;
}

