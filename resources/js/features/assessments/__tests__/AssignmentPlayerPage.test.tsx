import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AssignmentPlayerPage from '../pages/AssignmentPlayerPage';
import { useAuth } from '@/context/AuthContext';
import { useAssignment, useMySubmissions, useSubmitAssignment } from '../hooks/useAssignments';
import assignmentService from '../services/assignmentService';

vi.mock('@/context/AuthContext');
vi.mock('../hooks/useAssignments');
vi.mock('../services/assignmentService');

const mockUseAuth = vi.mocked(useAuth);
const mockUseAssignment = vi.mocked(useAssignment);
const mockUseMySubmissions = vi.mocked(useMySubmissions);
const mockUseSubmitAssignment = vi.mocked(useSubmitAssignment);

describe('AssignmentPlayerPage', () => {
    const mockSubmitMutate = vi.fn();

    const mockEmployee = {
        id: 3,
        name: 'Employee Learner',
        email: 'employee@elms.test',
        role: 'EMPLOYEE' as const,
        is_active: true,
    };

    const mockAssignment = {
        id: 1,
        module_id: 10,
        title: 'Enterprise Architecture Implementation Essay',
        instructions: 'Submit your architectural review essay in PDF format.',
        max_score: 100,
        passing_score: 75,
        max_attempts: 2,
        due_at: '2026-12-31T23:59:59Z',
        status: 'PUBLISHED' as const,
        is_required: true,
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
    };

    const renderPage = (enrollmentId = '5', assignmentId = '1') => {
        return render(
            <MemoryRouter initialEntries={[`/my-learning/${enrollmentId}/assignments/${assignmentId}`]}>
                <Routes>
                    <Route
                        path="/my-learning/:enrollmentId/assignments/:assignmentId"
                        element={<AssignmentPlayerPage />}
                    />
                </Routes>
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuth.mockReturnValue({
            user: mockEmployee,
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        mockUseSubmitAssignment.mockReturnValue({
            mutate: mockSubmitMutate,
            isPending: false,
            error: null,
        } as any);
    });

    it('renders loading skeleton while assignment is loading', () => {
        mockUseAssignment.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: [],
            isLoading: true,
            isError: false,
        } as any);

        const { container } = renderPage();
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders error state when assignment fails to load', () => {
        mockUseAssignment.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Assignment not found'),
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as any);

        renderPage();
        expect(screen.getByText('Assignment Not Found or Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Back to Course')).toBeInTheDocument();
    });

    it('renders assignment information and submission form when no submissions exist', () => {
        mockUseAssignment.mockReturnValue({
            data: mockAssignment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as any);

        renderPage();

        expect(screen.getByText('Enterprise Architecture Implementation Essay')).toBeInTheDocument();
        expect(screen.getByText('Submit your architectural review essay in PDF format.')).toBeInTheDocument();
        expect(screen.getByText('Max Points')).toBeInTheDocument();
        expect(screen.getByText('100 Points')).toBeInTheDocument();
        expect(screen.getByText('Attempt Limit')).toBeInTheDocument();
        expect(screen.getByText('Attempt 0 of 2')).toBeInTheDocument();

        // Check file submission form
        expect(screen.getByText('Submit Your Work')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Submit Assignment/i })).toBeInTheDocument();
    });

    it('submits a file successfully via the submission form', () => {
        mockUseAssignment.mockReturnValue({
            data: mockAssignment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as any);

        renderPage();

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(fileInput).toBeInTheDocument();
        const testFile = new File(['dummy essay content'], 'essay.pdf', { type: 'application/pdf' });

        Object.defineProperty(fileInput, 'files', {
            value: [testFile],
            writable: true,
        });
        fireEvent.change(fileInput);

        const notesInput = screen.getByPlaceholderText(/Describe your methodology/i);
        fireEvent.change(notesInput, { target: { value: 'Here is my architecture report.' } });

        const form = fileInput.closest('form')!;
        fireEvent.submit(form);

        expect(mockSubmitMutate).toHaveBeenCalledWith(
            expect.any(FormData),
            expect.any(Object)
        );
    });

    it('renders evaluation status and disables form when assignment is PASSED', () => {
        const passedSubmission = {
            id: 10,
            assignment_id: 1,
            user_id: 3,
            attempt_number: 1,
            file_name: 'essay.pdf',
            original_filename: 'essay.pdf',
            file_size: 10240,
            status: 'PASSED' as const,
            score: 92,
            feedback: 'Excellent breakdown of domain boundaries.',
            submitted_at: '2026-09-20T10:00:00Z',
            created_at: '2026-09-20T10:00:00Z',
            reviewed_at: '2026-09-21T09:00:00Z',
            reviewer: { id: 2, name: 'Instructor Bob', email: 'bob@elms.test', role: 'INSTRUCTOR' as const },
        };

        mockUseAssignment.mockReturnValue({
            data: mockAssignment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: [passedSubmission],
            isLoading: false,
            isError: false,
        } as any);

        renderPage();

        expect(screen.getByText('Evaluation Result: Passed')).toBeInTheDocument();
        expect(screen.getByText('Score: 92 / 100')).toBeInTheDocument();
        expect(screen.getByText('Excellent breakdown of domain boundaries.')).toBeInTheDocument();
        expect(screen.getByText(/You have already passed this assignment/i)).toBeInTheDocument();
        // The file input should not be present
        expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
    });

    it('allows resubmission if status is NEEDS_REVISION and attempts remain', () => {
        const revisionSubmission = {
            id: 10,
            assignment_id: 1,
            user_id: 3,
            attempt_number: 1,
            file_name: 'draft_essay.pdf',
            original_filename: 'draft_essay.pdf',
            file_size: 10240,
            status: 'NEEDS_REVISION' as const,
            score: 60,
            feedback: 'Please expand on database isolation principles.',
            submitted_at: '2026-09-20T10:00:00Z',
            created_at: '2026-09-20T10:00:00Z',
            reviewed_at: '2026-09-21T09:00:00Z',
            reviewer: { id: 2, name: 'Instructor Bob', email: 'bob@elms.test', role: 'INSTRUCTOR' as const },
        };

        mockUseAssignment.mockReturnValue({
            data: mockAssignment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: [revisionSubmission],
            isLoading: false,
            isError: false,
        } as any);

        renderPage();

        expect(screen.getByText('Evaluation Result: Revision Required')).toBeInTheDocument();
        expect(screen.getByText('Please expand on database isolation principles.')).toBeInTheDocument();
        // Form should be available for attempt 2 of 2
        expect(screen.getByRole('button', { name: /Submit Revision \(Attempt 2 of 2\)/i })).toBeInTheDocument();
        expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it('disallows submission when max attempts reached', () => {
        const submissions = [
            {
                id: 11,
                assignment_id: 1,
                user_id: 3,
                attempt_number: 2,
                file_name: 'draft_essay_v2.pdf',
                original_filename: 'draft_essay_v2.pdf',
                file_size: 12000,
                status: 'NEEDS_REVISION' as const,
                score: 65,
                feedback: 'Still below passing grade',
                submitted_at: '2026-09-21T10:00:00Z',
                created_at: '2026-09-21T10:00:00Z',
            },
            {
                id: 10,
                assignment_id: 1,
                user_id: 3,
                attempt_number: 1,
                file_name: 'draft_essay.pdf',
                original_filename: 'draft_essay.pdf',
                file_size: 10240,
                status: 'NEEDS_REVISION' as const,
                score: 50,
                feedback: 'Revise section 2',
                submitted_at: '2026-09-20T10:00:00Z',
                created_at: '2026-09-20T10:00:00Z',
            },
        ];

        mockUseAssignment.mockReturnValue({
            data: mockAssignment,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: submissions,
            isLoading: false,
            isError: false,
        } as any);

        renderPage();

        expect(screen.getByText(/You have reached the maximum allowed submission attempts \(2\)/i)).toBeInTheDocument();
        expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
    });

    it('disallows submission when assignment is closed', () => {
        mockUseAssignment.mockReturnValue({
            data: { ...mockAssignment, status: 'CLOSED' },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseMySubmissions.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        } as any);

        renderPage();

        expect(screen.getByText(/This assignment is closed and no longer accepting submissions/i)).toBeInTheDocument();
        expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument();
    });
});
