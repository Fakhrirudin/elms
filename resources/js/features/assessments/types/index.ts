export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Option {
    id: number;
    question_id: number;
    option_text: string;
    sort_order: number;
    // Strictly optional; only present post-submission in GET /attempts/{attempt}
    is_correct?: boolean;
}

export interface Question {
    id: number;
    quiz_id: number;
    question: string;
    sort_order: number;
    options: Option[];
    created_at?: string;
    updated_at?: string;
}

export interface Quiz {
    id: number;
    module_id: number;
    title: string;
    description?: string | null;
    passing_grade: number;
    max_attempts: number;
    time_limit_minutes?: number | null; // Metadata only; no client countdown timer
    status: QuizStatus;
    questions_count?: number;
    questions?: Question[];
    created_at?: string;
    updated_at?: string;
}

export interface QuizAnswer {
    id: number;
    attempt_id: number;
    question_id: number;
    option_id: number;
    created_at?: string;
    updated_at?: string;
}

export interface QuizAttempt {
    id: number;
    quiz_id: number;
    user_id: number;
    attempt_number: number;
    score?: number | null;
    passed?: boolean | null;
    started_at: string;
    submitted_at?: string | null;
    questions?: Question[];
    answers?: QuizAnswer[];
    created_at?: string;
    updated_at?: string;
}

export interface AnswerSubmission {
    question_id: number;
    option_id: number;
}

export interface SubmitQuizPayload {
    answers: AnswerSubmission[];
}

export interface QuizSubmitResult {
    attempt_id: number;
    score: number;
    passing_grade: number;
    passed: boolean;
    submitted_at: string;
}

