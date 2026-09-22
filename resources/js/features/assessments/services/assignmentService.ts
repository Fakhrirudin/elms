import api from '@/services/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import {
    Assignment,
    AssignmentSubmission,
    CreateAssignmentPayload,
    UpdateAssignmentPayload,
    ReviewSubmissionPayload,
    SubmissionFilterParams,
    SubmissionsListResult,
} from '../types/assignment';

export const assignmentService = {
    /**
     * GET /api/v1/modules/{moduleId}/assignments
     */
    async getModuleAssignments(moduleId: number | string): Promise<Assignment[]> {
        const response = await api.get<ApiResponse<Assignment[]>>(`/modules/${moduleId}/assignments`);
        return response.data.data;
    },

    /**
     * GET /api/v1/assignments/{assignmentId}
     */
    async getAssignment(assignmentId: number | string): Promise<Assignment> {
        const response = await api.get<ApiResponse<Assignment>>(`/assignments/${assignmentId}`);
        return response.data.data;
    },

    /**
     * POST /api/v1/modules/{moduleId}/assignments
     */
    async createAssignment(moduleId: number | string, payload: CreateAssignmentPayload): Promise<Assignment> {
        const response = await api.post<ApiResponse<Assignment>>(`/modules/${moduleId}/assignments`, payload);
        return response.data.data;
    },

    /**
     * PUT /api/v1/assignments/{assignmentId}
     */
    async updateAssignment(assignmentId: number | string, payload: UpdateAssignmentPayload): Promise<Assignment> {
        const response = await api.put<ApiResponse<Assignment>>(`/assignments/${assignmentId}`, payload);
        return response.data.data;
    },

    /**
     * DELETE /api/v1/assignments/{assignmentId}
     */
    async deleteAssignment(assignmentId: number | string): Promise<void> {
        await api.delete(`/assignments/${assignmentId}`);
    },

    /**
     * POST /api/v1/assignments/{assignmentId}/publish
     */
    async publishAssignment(assignmentId: number | string): Promise<Assignment> {
        const response = await api.post<ApiResponse<Assignment>>(`/assignments/${assignmentId}/publish`);
        return response.data.data;
    },

    /**
     * POST /api/v1/assignments/{assignmentId}/close
     */
    async closeAssignment(assignmentId: number | string): Promise<Assignment> {
        const response = await api.post<ApiResponse<Assignment>>(`/assignments/${assignmentId}/close`);
        return response.data.data;
    },

    /**
     * POST /api/v1/assignments/{assignmentId}/submissions
     */
    async submitAssignment(assignmentId: number | string, formData: FormData): Promise<AssignmentSubmission> {
        const response = await api.post<ApiResponse<AssignmentSubmission>>(
            `/assignments/${assignmentId}/submissions`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data.data;
    },

    /**
     * GET /api/v1/assignments/{assignmentId}/my-submissions
     */
    async getMySubmissions(assignmentId: number | string): Promise<AssignmentSubmission[]> {
        const response = await api.get<ApiResponse<AssignmentSubmission[]>>(
            `/assignments/${assignmentId}/my-submissions`
        );
        return response.data.data;
    },

    /**
     * GET /api/v1/assignments/{assignmentId}/submissions
     */
    async getSubmissions(
        assignmentId: number | string,
        params?: SubmissionFilterParams
    ): Promise<SubmissionsListResult> {
        const response = await api.get<PaginatedResponse<AssignmentSubmission>>(
            `/assignments/${assignmentId}/submissions`,
            { params }
        );
        return {
            submissions: response.data.data,
            meta: response.data.meta,
        };
    },

    /**
     * GET /api/v1/assignment-submissions/{submissionId}
     */
    async getSubmission(submissionId: number | string): Promise<AssignmentSubmission> {
        const response = await api.get<ApiResponse<AssignmentSubmission>>(
            `/assignment-submissions/${submissionId}`
        );
        return response.data.data;
    },

    /**
     * POST /api/v1/assignment-submissions/{submissionId}/start-review
     */
    async startReview(submissionId: number | string): Promise<AssignmentSubmission> {
        const response = await api.post<ApiResponse<AssignmentSubmission>>(
            `/assignment-submissions/${submissionId}/start-review`
        );
        return response.data.data;
    },

    /**
     * POST /api/v1/assignment-submissions/{submissionId}/review
     */
    async reviewSubmission(
        submissionId: number | string,
        payload: ReviewSubmissionPayload
    ): Promise<AssignmentSubmission> {
        const response = await api.post<ApiResponse<AssignmentSubmission>>(
            `/assignment-submissions/${submissionId}/review`,
            payload
        );
        return response.data.data;
    },

    /**
     * Trigger file download for an authorized submission
     */
    async downloadSubmissionFile(submissionId: number | string, filename?: string): Promise<void> {
        const response = await api.get(`/assignment-submissions/${submissionId}/download`, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `submission-${submissionId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },
};

export default assignmentService;
