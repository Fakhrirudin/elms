import { useQuery } from '@tanstack/react-query';
import quizService from '../services/quizService';
import { Quiz } from '../types';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const useQuiz = (quizId: number | string | undefined) => {
    return useQuery<Quiz, AxiosError<ApiError>>({
        queryKey: ['quiz', quizId],
        queryFn: () => quizService.getQuiz(quizId!),
        enabled: Boolean(quizId),
        staleTime: 1000 * 60 * 5,
    });
};

export default useQuiz;

