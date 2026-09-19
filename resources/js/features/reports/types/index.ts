import { PaginationMeta } from '@/types/api';

// ==========================================
// 1. Course Performance Report
// ==========================================

export interface CourseReportCategory {
    id: number;
    name: string;
}

export interface CourseReportItem {
    course_id: number;
    title: string;
    slug: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    category: CourseReportCategory | null;
    total_enrollments: number;
    in_progress_count: number;
    completed_count: number;
    completion_rate: number; // float 0.0 - 100.0
}

export interface CourseReportParams {
    page?: number;
    per_page?: number;
    course_id?: number;
    category_id?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface CourseReportResult {
    items: CourseReportItem[];
    meta: PaginationMeta;
}

// ==========================================
// 2. Learning Progress Report
// ==========================================

export interface LearningReportEmployee {
    id: number;
    name: string;
    nip: string | null;
    department: string | null;
}

export interface LearningReportCourse {
    id: number;
    title: string;
}

export interface LearningReportItem {
    enrollment_id: number;
    employee: LearningReportEmployee;
    course: LearningReportCourse;
    status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number; // integer 0 - 100
    enrolled_at: string; // ISO date string
    completed_at: string | null; // ISO date string or null
}

export interface LearningReportParams {
    page?: number;
    per_page?: number;
    course_id?: number;
    department_id?: number;
    status?: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';
    user_id?: number;
}

export interface LearningReportResult {
    items: LearningReportItem[];
    meta: PaginationMeta;
}

// ==========================================
// 3. Quiz Performance Report
// ==========================================

export interface QuizReportCourse {
    id: number;
    title: string;
}

export interface QuizReportItem {
    quiz_id: number;
    quiz_title: string;
    course: QuizReportCourse;
    passing_grade: number; // float
    total_attempts: number;
    total_passed: number;
    total_failed: number;
    pass_rate: number; // float 0.0 - 100.0
    average_score: number; // float
    min_score: number; // float
    max_score: number; // float
}

export interface QuizReportParams {
    page?: number;
    per_page?: number;
    quiz_id?: number;
    course_id?: number;
}

export interface QuizReportResult {
    items: QuizReportItem[];
    meta: PaginationMeta;
}

// ==========================================
// 4. Tab Navigation Types
// ==========================================

export type ReportTab = 'courses' | 'learning' | 'quiz';
