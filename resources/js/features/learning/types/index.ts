import { Course } from '@/features/courses/types';
import { Certificate } from '@/features/certificates/types';
import { PaginationMeta } from '@/types/api';

export type EnrollmentStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';

export type ActivityType = 'MATERIAL' | 'QUIZ' | 'ASSIGNMENT';

export type ActivityStatus =
    | 'AVAILABLE'
    | 'COMPLETED'
    | 'PASSED'
    | 'FAILED'
    | 'NOT_SUBMITTED'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'NEEDS_REVISION';

export interface ModuleOutlineActivity {
    type: ActivityType;
    id: number;
    module_id: number;
    title: string;
    sort_order: number;
    is_required: boolean;
    status: ActivityStatus | string;
    // Material specific
    material_type?: 'TEXT' | 'PDF' | 'VIDEO';
    content?: string | null;
    file_path?: string | null;
    video_url?: string | null;
    completed_at?: string | null;
    // Quiz specific
    description?: string | null;
    passing_grade?: number;
    max_attempts?: number;
    time_limit_minutes?: number | null;
    attempts_count?: number;
    latest_attempt?: {
        id: number;
        attempt_number: number;
        score: number | null;
        passed: boolean;
        submitted_at?: string | null;
    } | null;
    // Assignment specific
    instructions?: string | null;
    max_score?: number;
    due_at?: string | null;
    submission_count?: number;
    latest_submission?: {
        id: number;
        attempt_number: number;
        status: string;
        score?: number | null;
        feedback?: string | null;
        submitted_at?: string | null;
        reviewed_at?: string | null;
    } | null;
}

export interface ModuleOutline {
    id: number;
    title: string;
    description?: string | null;
    order: number;
    is_completed: boolean;
    total_required: number;
    completed_required: number;
    activities: ModuleOutlineActivity[];
}

export interface CurrentActivityInfo {
    type: ActivityType;
    id: number;
    title?: string;
    module_id?: number;
    module_title?: string;
    status?: string;
}

export interface LearningOverview {
    enrollment_id: number;
    course_id: number;
    status: EnrollmentStatus;
    completed_at?: string | null;
    overall_percentage: number;
    total_required_activities: number;
    completed_required_activities: number;
    total_modules: number;
    completed_modules: number;
    is_course_completed: boolean;
    modules: ModuleOutline[];
    last_activity?: {
        type: ActivityType | null;
        id: number | null;
        accessed_at?: string | null;
        activity_details?: any;
    } | null;
    current_activity?: CurrentActivityInfo | null;
    certificate?: {
        is_eligible?: boolean;
        reasons?: string[];
        certificate?: {
            id: number;
            certificate_number: string;
            verification_url?: string;
            issued_at: string;
        } | null;
        id?: number;
        certificate_number?: string;
        issued_at?: string;
    } | null;
}

export interface EnrollmentProgressSummary {
    percentage: number;
    total_required: number;
    completed_required: number;
    total_modules: number;
    completed_modules: number;
    last_activity?: {
        type: ActivityType | null;
        id: number | null;
        accessed_at?: string | null;
        title?: string | null;
        module_id?: number | null;
    } | null;
}

export interface Enrollment {
    id: number;
    user_id: number;
    course_id: number;
    status: EnrollmentStatus;
    enrolled_at: string;
    completed_at?: string | null;
    last_activity_type?: ActivityType | null;
    last_activity_id?: number | null;
    last_accessed_at?: string | null;
    progress?: EnrollmentProgressSummary;
    course?: Course;
    certificate?: Certificate | null;
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

export interface UpdateActivityPayload {
    activity_type: ActivityType;
    activity_id: number;
}
