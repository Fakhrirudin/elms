import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/services/api';
import quizService from '../services/quizService';

vi.mock('@/services/api');
const mockApi = vi.mocked(api);

describe('quizService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getQuiz sends GET request to /quizzes/:id and returns quiz data', async () => {
        const mockQuiz = {
            id: 1,
            module_id: 2,
            title: 'Evaluasi Arsitektur Web',
            passing_grade: 70,
            max_attempts: 3,
            status: 'PUBLISHED' as const,
            questions: [
                {
                    id: 10,
                    quiz_id: 1,
                    question: 'Apa itu Modular Monolith?',
                    sort_order: 1,
                    options: [
                        { id: 101, question_id: 10, option_text: 'Option A', sort_order: 1 },
                        { id: 102, question_id: 10, option_text: 'Option B', sort_order: 2 },
                    ],
                },
            ],
        };

        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Quiz retrieved successfully',
                data: mockQuiz,
            },
        });

        const result = await quizService.getQuiz(1);

        expect(mockApi.get).toHaveBeenCalledWith('/quizzes/1');
        expect(result).toEqual(mockQuiz);
    });

    it('startQuizAttempt sends POST request to /quizzes/:id/attempts and returns attempt data', async () => {
        const mockAttempt = {
            id: 25,
            quiz_id: 1,
            user_id: 3,
            attempt_number: 1,
            started_at: '2026-03-01T10:00:00Z',
            submitted_at: null,
            questions: [],
        };

        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Quiz attempt started',
                data: mockAttempt,
            },
        });

        const result = await quizService.startQuizAttempt(1);

        expect(mockApi.post).toHaveBeenCalledWith('/quizzes/1/attempts');
        expect(result).toEqual(mockAttempt);
    });

    it('getQuizAttempt sends GET request to /attempts/:id and returns attempt review', async () => {
        const mockAttemptReview = {
            id: 25,
            quiz_id: 1,
            user_id: 3,
            attempt_number: 1,
            score: 100,
            passed: true,
            started_at: '2026-03-01T10:00:00Z',
            submitted_at: '2026-03-01T10:15:00Z',
            questions: [
                {
                    id: 10,
                    quiz_id: 1,
                    question: 'Question 1',
                    sort_order: 1,
                    options: [
                        { id: 101, question_id: 10, option_text: 'Option A', sort_order: 1, is_correct: false },
                        { id: 102, question_id: 10, option_text: 'Option B', sort_order: 2, is_correct: true },
                    ],
                },
            ],
            answers: [{ id: 1, attempt_id: 25, question_id: 10, option_id: 102 }],
        };

        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Quiz attempt retrieved successfully',
                data: mockAttemptReview,
            },
        });

        const result = await quizService.getQuizAttempt(25);

        expect(mockApi.get).toHaveBeenCalledWith('/attempts/25');
        expect(result).toEqual(mockAttemptReview);
    });

    it('submitQuizAttempt sends POST request to /attempts/:id/submit with answers and returns result', async () => {
        const mockSubmitResult = {
            attempt_id: 25,
            score: 100,
            passing_grade: 70,
            passed: true,
            submitted_at: '2026-03-01T10:15:00Z',
        };

        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Quiz submitted successfully',
                data: mockSubmitResult,
            },
        });

        const payload = {
            answers: [{ question_id: 10, option_id: 102 }],
        };

        const result = await quizService.submitQuizAttempt(25, payload);

        expect(mockApi.post).toHaveBeenCalledWith('/attempts/25/submit', payload);
        expect(result).toEqual(mockSubmitResult);
    });

    it('propagates API error when startQuizAttempt fails with 422 max attempts reached', async () => {
        const errorResponse = {
            response: {
                status: 422,
                data: {
                    message: 'Maximum quiz attempts reached.',
                    errors: { quiz: ['Maximum quiz attempts reached.'] },
                },
            },
        };

        mockApi.post.mockRejectedValueOnce(errorResponse);

        await expect(quizService.startQuizAttempt(1)).rejects.toEqual(errorResponse);
    });
});

