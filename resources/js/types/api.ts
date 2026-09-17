export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginationMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    [key: string]: unknown;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
    meta: PaginationMeta;
}

export interface ApiError {
    message: string;
    errors?: Record<string, string[]> | null;
    status?: number;
}

export interface ApiValidationError extends ApiError {
    errors: Record<string, string[]>;
}
