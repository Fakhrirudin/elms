import { useMutation, useQueryClient } from '@tanstack/react-query';
import quizService from '../services/quizService';
import { QuizSubmitResult, SubmitQuizPayload } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export interface SubmitQuizAttemptParams {
    attemptId: number | string;
    quizId: number | string;
    enrollmentId?: number | string;
    payload: SubmitQuizPayload;
}

export const useSubmitQuizAttempt = () => {
    const queryClient = useQueryClient();

    return useMutation<QuizSubmitResult, AxiosError<ApiError>, SubmitQuizAttemptParams>({
        mutationFn: ({ attemptId, payload }) =>
            quizService.submitQuizAttempt(attemptId, payload),
        onSuccess: (_data, { attemptId, quizId, enrollmentId }) => {
            // Invalidate attempt review (now revealing is_correct on options)
            queryClient.invalidateQueries({ queryKey: ['quiz-attempt', attemptId] });
            // Invalidate quiz state
            queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });

            // Invalidate learning progress and enrollment if within an enrollment context
            if (enrollmentId) {
                queryClient.invalidateQueries({ queryKey: ['learning-progress', enrollmentId] });
                queryClient.invalidateQueries({ queryKey: ['enrollment', enrollmentId] });
            }

            // Invalidate dashboard counters
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
};

export default useSubmitQuizAttempt;

