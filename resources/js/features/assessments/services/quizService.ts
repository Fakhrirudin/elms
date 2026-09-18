import api from '@/services/api';
import { ApiResponse } from '@/types/api';
import {
    Quiz,
    QuizAttempt,
    QuizSubmitResult,
    SubmitQuizPayload,
} from '../types';

export const quizService = {
    /**
     * Get quiz details and question set.
     * GET /api/v1/quizzes/{quizId}
     * Note: For employee, backend omits is_correct key from options.
     */
    async getQuiz(quizId: number | string): Promise<Quiz> {
        const response = await api.get<ApiResponse<Quiz>>(`/quizzes/${quizId}`);
        return response.data.data;
    },

    /**
     * Start a new quiz attempt or retry.
     * POST /api/v1/quizzes/{quizId}/attempts
     */
    async startQuizAttempt(quizId: number | string): Promise<QuizAttempt> {
        const response = await api.post<ApiResponse<QuizAttempt>>(`/quizzes/${quizId}/attempts`);
        return response.data.data;
    },

    /**
     * Get specific quiz attempt details.
     * GET /api/v1/attempts/{attemptId}
     * Note: After submission (submitted_at !== null), backend reveals is_correct on options.
     */
    async getQuizAttempt(attemptId: number | string): Promise<QuizAttempt> {
        const response = await api.get<ApiResponse<QuizAttempt>>(`/attempts/${attemptId}`);
        return response.data.data;
    },

    /**
     * Submit answers for an active attempt.
     * POST /api/v1/attempts/{attemptId}/submit
     */
    async submitQuizAttempt(
        attemptId: number | string,
        payload: SubmitQuizPayload
    ): Promise<QuizSubmitResult> {
        const response = await api.post<ApiResponse<QuizSubmitResult>>(
            `/attempts/${attemptId}/submit`,
            payload
        );
        return response.data.data;
    },
};

export default quizService;

