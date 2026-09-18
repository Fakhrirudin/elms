import { useQuery } from '@tanstack/react-query';
import quizService from '../services/quizService';
import { QuizAttempt } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useQuizAttempt = (attemptId: number | string | undefined) => {
    return useQuery<QuizAttempt, AxiosError<ApiError>>({
        queryKey: ['quiz-attempt', attemptId],
        queryFn: () => quizService.getQuizAttempt(attemptId!),
        enabled: Boolean(attemptId),
        staleTime: Infinity,
    });
};

export default useQuizAttempt;

