import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import assignmentService from '../services/assignmentService';
import {
    Assignment,
    AssignmentSubmission,
    ReviewSubmissionPayload,
    SubmissionFilterParams,
    SubmissionsListResult,
} from '../types/assignment';

export const useAssignment = (assignmentId: number | string | undefined, options?: { enabled?: boolean }) => {
    return useQuery<Assignment, Error>({
        queryKey: ['assignment', assignmentId],
        queryFn: () => assignmentService.getAssignment(assignmentId!),
        enabled: Boolean(assignmentId) && (options?.enabled ?? true),
        staleTime: 30 * 1000,
    });
};

export const useMySubmissions = (assignmentId: number | string | undefined, options?: { enabled?: boolean }) => {
    return useQuery<AssignmentSubmission[], Error>({
        queryKey: ['my-submissions', assignmentId],
        queryFn: () => assignmentService.getMySubmissions(assignmentId!),
        enabled: Boolean(assignmentId) && (options?.enabled ?? true),
        staleTime: 30 * 1000,
    });
};

export const useAssignmentSubmissions = (
    assignmentId: number | string | undefined,
    filters?: SubmissionFilterParams,
    options?: { enabled?: boolean }
) => {
    return useQuery<SubmissionsListResult, Error>({
        queryKey: ['assignment-submissions', assignmentId, filters],
        queryFn: () => assignmentService.getSubmissions(assignmentId!, filters),
        enabled: Boolean(assignmentId) && (options?.enabled ?? true),
        staleTime: 15 * 1000,
    });
};

export const useSubmitAssignment = (assignmentId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation<AssignmentSubmission, Error, FormData>({
        mutationFn: (formData) => assignmentService.submitAssignment(assignmentId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
            queryClient.invalidateQueries({ queryKey: ['my-submissions', assignmentId] });
            queryClient.invalidateQueries({ queryKey: ['course-modules'] });
            queryClient.invalidateQueries({ queryKey: ['enrollment'] });
            queryClient.invalidateQueries({ queryKey: ['learning-progress'] });
        },
    });
};

export const useReviewSubmission = (assignmentId?: number | string) => {
    const queryClient = useQueryClient();

    return useMutation<AssignmentSubmission, Error, { submissionId: number | string; payload: ReviewSubmissionPayload }>({
        mutationFn: ({ submissionId, payload }) => assignmentService.reviewSubmission(submissionId, payload),
        onSuccess: () => {
            if (assignmentId) {
                queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
                queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
            }
        },
    });
};

export const useStartReview = (assignmentId?: number | string) => {
    const queryClient = useQueryClient();

    return useMutation<AssignmentSubmission, Error, number | string>({
        mutationFn: (submissionId) => assignmentService.startReview(submissionId),
        onSuccess: () => {
            if (assignmentId) {
                queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
            }
        },
    });
};
