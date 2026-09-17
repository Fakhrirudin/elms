import { PaginationMeta } from '@/types/api';

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type MaterialType = 'TEXT' | 'PDF' | 'VIDEO';

export interface CategorySummary {
    id: number;
    name: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface CourseInstructor {
    id: number;
    name: string;
    email: string;
    employee_number?: string | null;
}

export interface Course {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    thumbnail?: string | null;
    category?: CategorySummary | null;
    estimated_duration?: number | null;
    status: CourseStatus;
    published_at?: string | null;
    instructors?: CourseInstructor[];
    created_at?: string;
    updated_at?: string;
}

export interface Material {
    id: number;
    module_id: number;
    title: string;
    type: MaterialType;
    content?: string | null;
    file_path?: string | null;
    video_url?: string | null;
    sort_order: number;
    is_mandatory: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CourseModule {
    id: number;
    course_id: number;
    title: string;
    description?: string | null;
    sort_order: number;
    materials?: Material[];
    created_at?: string;
    updated_at?: string;
}

export type CourseSortOption = 'newest' | 'title_asc' | 'title_desc' | 'recently_published';

export type CourseSortBy = 'created_at' | 'title' | 'published_at';
export type CourseSortDirection = 'asc' | 'desc';

export interface CourseFilterParams {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number | string;
    sort_by?: CourseSortBy;
    sort_direction?: CourseSortDirection;
}

export interface CourseListResult {
    courses: Course[];
    meta: PaginationMeta;
}

