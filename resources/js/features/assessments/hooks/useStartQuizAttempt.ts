import { useMutation, useQueryClient } from '@tanstack/react-query';
import quizService from '../services/quizService';
import { QuizAttempt } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useStartQuizAttempt = () => {
    const queryClient = useQueryClient();

    return useMutation<QuizAttempt, AxiosError<ApiError>, number | string>({
        mutationFn: (quizId) => quizService.startQuizAttempt(quizId),
        onSuccess: (attempt, quizId) => {
            queryClient.setQueryData(['quiz-attempt', attempt.id], attempt);
            queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
        },
    });
};

export default useStartQuizAttempt;

