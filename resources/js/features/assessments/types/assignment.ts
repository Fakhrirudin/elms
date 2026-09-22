import { PaginationMeta } from '@/types/api';

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export type SubmissionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'PASSED' | 'NEEDS_REVISION';

export interface AssignmentSubmission {
    id: number;
    assignment_id: number;
    user_id: number;
    user?: {
        id: number;
        name: string;
        email: string;
        department?: string | null;
    };
    attempt_number: number;
    original_filename: string;
    mime_type: string;
    file_size: number;
    comment?: string | null;
    status: SubmissionStatus;
    submitted_at: string;
    score?: number | null;
    feedback?: string | null;
    reviewed_by?: number | null;
    reviewer?: {
        id: number;
        name: string;
    } | null;
    reviewed_at?: string | null;
    download_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Assignment {
    id: number;
    module_id: number;
    course_id?: number;
    title: string;
    instructions: string;
    due_at?: string | null;
    max_score: number;
    max_attempts: number;
    is_required: boolean;
    status: AssignmentStatus;
    created_by: number;
    published_at?: string | null;
    closed_at?: string | null;
    submissions_count?: number;
    latest_submission?: AssignmentSubmission | null;
    created_at?: string;
    updated_at?: string;
}

export interface CreateAssignmentPayload {
    title: string;
    instructions: string;
    due_at?: string | null;
    max_score?: number;
    max_attempts?: number;
    is_required?: boolean;
}

export interface UpdateAssignmentPayload {
    title?: string;
    instructions?: string;
    due_at?: string | null;
    max_score?: number;
    max_attempts?: number;
    is_required?: boolean;
}

export interface ReviewSubmissionPayload {
    status: 'PASSED' | 'NEEDS_REVISION';
    score: number;
    feedback?: string | null;
}

export interface SubmissionFilterParams {
    page?: number;
    per_page?: number;
    status?: SubmissionStatus | string;
    search?: string;
}

export interface SubmissionsListResult {
    submissions: AssignmentSubmission[];
    meta: PaginationMeta;
}
