import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/services/api';
import assignmentService from '../services/assignmentService';

vi.mock('@/services/api');
const mockApi = vi.mocked(api);

describe('assignmentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getModuleAssignments sends GET request to /modules/:id/assignments and returns list', async () => {
        const mockAssignments = [
            { id: 1, module_id: 10, title: 'Final Project Essay', status: 'PUBLISHED', max_score: 100 },
        ];
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignments retrieved successfully',
                data: mockAssignments,
            },
        });

        const result = await assignmentService.getModuleAssignments(10);
        expect(mockApi.get).toHaveBeenCalledWith('/modules/10/assignments');
        expect(result).toEqual(mockAssignments);
    });

    it('getAssignment sends GET request to /assignments/:id and returns assignment', async () => {
        const mockAssignment = { id: 1, title: 'Assignment 1', max_attempts: 2, status: 'PUBLISHED' };
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignment retrieved successfully',
                data: mockAssignment,
            },
        });

        const result = await assignmentService.getAssignment(1);
        expect(mockApi.get).toHaveBeenCalledWith('/assignments/1');
        expect(result).toEqual(mockAssignment);
    });

    it('createAssignment sends POST request to /modules/:id/assignments', async () => {
        const payload = { title: 'New Assignment', instructions: 'Submit detailed analysis', max_score: 100, max_attempts: 2 };
        const mockCreated = { id: 5, module_id: 10, ...payload, status: 'DRAFT' };
        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignment created successfully',
                data: mockCreated,
            },
        });

        const result = await assignmentService.createAssignment(10, payload);
        expect(mockApi.post).toHaveBeenCalledWith('/modules/10/assignments', payload);
        expect(result).toEqual(mockCreated);
    });

    it('updateAssignment sends PUT request to /assignments/:id', async () => {
        const payload = { title: 'Updated Title' };
        const mockUpdated = { id: 5, title: 'Updated Title' };
        mockApi.put.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignment updated successfully',
                data: mockUpdated,
            },
        });

        const result = await assignmentService.updateAssignment(5, payload);
        expect(mockApi.put).toHaveBeenCalledWith('/assignments/5', payload);
        expect(result).toEqual(mockUpdated);
    });

    it('publishAssignment sends POST to /assignments/:id/publish', async () => {
        const mockPublished = { id: 5, status: 'PUBLISHED' };
        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignment published successfully',
                data: mockPublished,
            },
        });

        const result = await assignmentService.publishAssignment(5);
        expect(mockApi.post).toHaveBeenCalledWith('/assignments/5/publish');
        expect(result).toEqual(mockPublished);
    });

    it('closeAssignment sends POST to /assignments/:id/close', async () => {
        const mockClosed = { id: 5, status: 'CLOSED' };
        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignment closed successfully',
                data: mockClosed,
            },
        });

        const result = await assignmentService.closeAssignment(5);
        expect(mockApi.post).toHaveBeenCalledWith('/assignments/5/close');
        expect(result).toEqual(mockClosed);
    });

    it('deleteAssignment sends DELETE to /assignments/:id', async () => {
        mockApi.delete.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignment deleted successfully',
            },
        });

        await assignmentService.deleteAssignment(5);
        expect(mockApi.delete).toHaveBeenCalledWith('/assignments/5');
    });

    it('getMySubmissions sends GET to /assignments/:id/my-submissions', async () => {
        const mockSubmissions = [{ id: 1, attempt_number: 1, status: 'SUBMITTED' }];
        mockApi.get.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Submissions retrieved successfully',
                data: mockSubmissions,
            },
        });

        const result = await assignmentService.getMySubmissions(5);
        expect(mockApi.get).toHaveBeenCalledWith('/assignments/5/my-submissions');
        expect(result).toEqual(mockSubmissions);
    });

    it('submitAssignment sends POST to /assignments/:id/submissions with multipart headers', async () => {
        const formData = new FormData();
        formData.append('notes', 'My submission');
        const mockSub = { id: 10, attempt_number: 1, status: 'SUBMITTED' };
        mockApi.post.mockResolvedValueOnce({
            data: {
                success: true,
                message: 'Assignment submitted successfully',
                data: mockSub,
            },
        });

        const result = await assignmentService.submitAssignment(5, formData);
        expect(mockApi.post).toHaveBeenCalledWith('/assignments/5/submissions', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        expect(result).toEqual(mockSub);
    });

    it('getSubmissions sends GET to /assignments/:id/submissions with params', async () => {
        const mockPaginated = {
            data: [{ id: 10, attempt_number: 1 }],
            meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
        };
        mockApi.get.mockResolvedValueOnce({
            data: mockPaginated,
        });

        const result = await assignmentService.getSubmissions(5, { page: 1, status: 'SUBMITTED' });
        expect(mockApi.get).toHaveBeenCalledWith('/assignments/5/submissions', {
            params: { page: 1, status: 'SUBMITTED' },
        });
        expect(result.submissions).toEqual(mockPaginated.data);
    });

    it('startReview and reviewSubmission manage the review lifecycle', async () => {
        const mockUnderReview = { id: 10, status: 'UNDER_REVIEW' };
        mockApi.post.mockResolvedValueOnce({
            data: { success: true, message: 'Review started', data: mockUnderReview },
        });

        const res1 = await assignmentService.startReview(10);
        expect(mockApi.post).toHaveBeenCalledWith('/assignment-submissions/10/start-review');
        expect(res1).toEqual(mockUnderReview);

        const reviewPayload = { status: 'PASSED' as const, score: 95, feedback: 'Great job!' };
        const mockPassed = { id: 10, status: 'PASSED', score: 95 };
        mockApi.post.mockResolvedValueOnce({
            data: { success: true, message: 'Submission reviewed', data: mockPassed },
        });

        const res2 = await assignmentService.reviewSubmission(10, reviewPayload);
        expect(mockApi.post).toHaveBeenCalledWith('/assignment-submissions/10/review', reviewPayload);
        expect(res2).toEqual(mockPassed);
    });

    it('downloadSubmissionFile requests blob and clicks anchor', async () => {
        const mockBlob = new Blob(['sample content'], { type: 'application/pdf' });
        mockApi.get.mockResolvedValueOnce({
            data: mockBlob,
        });

        // Mock window.URL
        window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-blob');
        window.URL.revokeObjectURL = vi.fn();

        await assignmentService.downloadSubmissionFile(10, 'my-file.pdf');
        expect(mockApi.get).toHaveBeenCalledWith('/assignment-submissions/10/download', {
            responseType: 'blob',
        });
    });
});
