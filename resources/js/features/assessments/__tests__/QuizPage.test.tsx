import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuizPage from '../pages/QuizPage';
import useAuth from '@/hooks/useAuth';
import useQuiz from '../hooks/useQuiz';
import useStartQuizAttempt from '../hooks/useStartQuizAttempt';
import useSubmitQuizAttempt from '../hooks/useSubmitQuizAttempt';
import useQuizAttempt from '../hooks/useQuizAttempt';

vi.mock('@/hooks/useAuth');
vi.mock('../hooks/useQuiz');
vi.mock('../hooks/useStartQuizAttempt');
vi.mock('../hooks/useSubmitQuizAttempt');
vi.mock('../hooks/useQuizAttempt');

const mockUseAuth = vi.mocked(useAuth);
const mockUseQuiz = vi.mocked(useQuiz);
const mockUseStartQuizAttempt = vi.mocked(useStartQuizAttempt);
const mockUseSubmitQuizAttempt = vi.mocked(useSubmitQuizAttempt);
const mockUseQuizAttempt = vi.mocked(useQuizAttempt);

describe('QuizPage', () => {
    const mockStartMutate = vi.fn();
    const mockSubmitMutate = vi.fn();

    const mockEmployee = {
        id: 3,
        name: 'Employee Learner',
        email: 'employee@elms.test',
        role: 'EMPLOYEE' as const,
        is_active: true,
    };

    const mockInstructor = {
        id: 2,
        name: 'Instructor User',
        email: 'instructor@elms.test',
        role: 'INSTRUCTOR' as const,
        is_active: true,
    };

    const mockQuizData = {
        id: 1,
        module_id: 2,
        title: 'Evaluasi Arsitektur Web',
        description: 'Uji pemahaman terkait Modular Monolith dan arsitektur.',
        passing_grade: 70,
        max_attempts: 3,
        time_limit_minutes: 30,
        status: 'PUBLISHED' as const,
        questions_count: 2,
        questions: [
            {
                id: 10,
                quiz_id: 1,
                question: 'Apa keunggulan Modular Monolith?',
                sort_order: 1,
                options: [
                    { id: 101, question_id: 10, option_text: 'Spaghetti code', sort_order: 1 },
                    { id: 102, question_id: 10, option_text: 'Domain boundary isolation', sort_order: 2 },
                ],
            },
            {
                id: 20,
                quiz_id: 1,
                question: 'Kapan transaksi database di-commit?',
                sort_order: 2,
                options: [
                    { id: 201, question_id: 20, option_text: 'Setelah seluruh operasi valid', sort_order: 1 },
                    { id: 202, question_id: 20, option_text: 'Sebelum validasi input', sort_order: 2 },
                ],
            },
        ],
    };

    const renderQuizPage = (enrollmentId = '5', quizId = '1') => {
        return render(
            <MemoryRouter initialEntries={[`/my-learning/${enrollmentId}/quizzes/${quizId}`]}>
                <Routes>
                    <Route
                        path="/my-learning/:enrollmentId/quizzes/:quizId"
                        element={<QuizPage />}
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

        mockUseQuiz.mockReturnValue({
            data: mockQuizData,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        mockUseStartQuizAttempt.mockReturnValue({
            mutate: mockStartMutate,
            isPending: false,
            isError: false,
            error: null,
        } as any);

        mockUseSubmitQuizAttempt.mockReturnValue({
            mutate: mockSubmitMutate,
            isPending: false,
            isError: false,
            error: null,
        } as any);

        mockUseQuizAttempt.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);
    });

    it('blocks non-employee roles with an access guard notice', () => {
        mockUseAuth.mockReturnValue({
            user: mockInstructor,
            token: 'test-token',
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
        });

        renderQuizPage();

        expect(screen.getByText(/employee quiz access only/i)).toBeInTheDocument();
        expect(screen.queryByTestId('start-quiz-btn')).not.toBeInTheDocument();
    });

    it('renders skeleton loading state while fetching quiz definition', () => {
        mockUseQuiz.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        renderQuizPage();

        expect(screen.getByTestId('quiz-skeleton')).toBeInTheDocument();
    });

    it('renders access restricted card when quiz fetch returns 403 Forbidden', () => {
        mockUseQuiz.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: {
                response: {
                    status: 403,
                    data: { message: 'This action is unauthorized.' },
                },
            } as any,
            refetch: vi.fn(),
        } as any);

        renderQuizPage();

        expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
        expect(screen.getByText(/you must be actively enrolled/i)).toBeInTheDocument();
    });

    it('renders Phase 1 (Intro State) with rules, passing grade, and start button on initial load or reload', () => {
        renderQuizPage();

        expect(screen.getByText('Evaluasi Arsitektur Web')).toBeInTheDocument();
        expect(screen.getByText(/passing grade: 70%/i)).toBeInTheDocument();
        expect(screen.getByText(/max attempts: 3/i)).toBeInTheDocument();
        expect(screen.getByText(/2 multiple-choice questions/i)).toBeInTheDocument();
        expect(screen.getByTestId('start-quiz-btn')).toBeInTheDocument();
    });

    it('starts attempt on button click and enters Phase 2 (Active Attempt)', () => {
        mockStartMutate.mockImplementation((_quizId, options) => {
            options?.onSuccess?.({
                id: 100,
                quiz_id: 1,
                user_id: 3,
                attempt_number: 1,
                started_at: '2026-03-01T10:00:00Z',
                submitted_at: null,
                questions: mockQuizData.questions,
            });
        });

        renderQuizPage();

        const startBtn = screen.getByTestId('start-quiz-btn');
        fireEvent.click(startBtn);

        expect(mockStartMutate).toHaveBeenCalledWith('1', expect.any(Object));

        // Now in Phase 2
        expect(screen.getByTestId('active-quiz-container')).toBeInTheDocument();
        expect(screen.getByText('Attempt #1')).toBeInTheDocument();
        expect(screen.getByText('0 of 2 answered')).toBeInTheDocument();
        expect(screen.getByText('Apa keunggulan Modular Monolith?')).toBeInTheDocument();
        expect(screen.getByText('Kapan transaksi database di-commit?')).toBeInTheDocument();
    });

    it('updates progress counter as answers are selected in active attempt', () => {
        mockStartMutate.mockImplementation((_quizId, options) => {
            options?.onSuccess?.({
                id: 100,
                quiz_id: 1,
                user_id: 3,
                attempt_number: 1,
                started_at: '2026-03-01T10:00:00Z',
                submitted_at: null,
                questions: mockQuizData.questions,
            });
        });

        renderQuizPage();

        fireEvent.click(screen.getByTestId('start-quiz-btn'));

        // Select first question option
        fireEvent.click(screen.getByTestId('question-option-102'));
        expect(screen.getByText('1 of 2 answered')).toBeInTheDocument();
        expect(screen.getByText(/1 unanswered question\(s\) remaining/i)).toBeInTheDocument();

        // Select second question option
        fireEvent.click(screen.getByTestId('question-option-201'));
        expect(screen.getByText('2 of 2 answered')).toBeInTheDocument();
        expect(screen.getByText(/all questions answered/i)).toBeInTheDocument();
    });

    it('submits answers and displays Phase 3 (Authoritative Result)', () => {
        mockStartMutate.mockImplementation((_quizId, options) => {
            options?.onSuccess?.({
                id: 100,
                quiz_id: 1,
                user_id: 3,
                attempt_number: 1,
                started_at: '2026-03-01T10:00:00Z',
                submitted_at: null,
                questions: mockQuizData.questions,
            });
        });

        mockSubmitMutate.mockImplementation(({ payload }, options) => {
            options?.onSuccess?.({
                attempt_id: 100,
                score: 100,
                passing_grade: 70,
                passed: true,
                submitted_at: '2026-03-01T10:05:00Z',
            });
        });

        renderQuizPage('5', '1');

        // Start
        fireEvent.click(screen.getByTestId('start-quiz-btn'));

        // Answer
        fireEvent.click(screen.getByTestId('question-option-102'));
        fireEvent.click(screen.getByTestId('question-option-201'));

        // Submit
        const submitBtn = screen.getByTestId('submit-quiz-btn');
        fireEvent.click(submitBtn);

        expect(mockSubmitMutate).toHaveBeenCalledWith(
            {
                attemptId: 100,
                quizId: '1',
                enrollmentId: '5',
                payload: {
                    answers: [
                        { question_id: 10, option_id: 102 },
                        { question_id: 20, option_id: 201 },
                    ],
                },
            },
            expect.any(Object)
        );

        // Result Card displayed
        expect(screen.getByTestId('quiz-result-card')).toBeInTheDocument();
        expect(screen.getByTestId('quiz-score-value')).toHaveTextContent('100%');
        expect(screen.getByText(/assessment passed/i)).toBeInTheDocument();
    });

    it('handles failed score result and allows retake attempt', () => {
        mockStartMutate.mockImplementation((_quizId, options) => {
            options?.onSuccess?.({
                id: 100,
                quiz_id: 1,
                user_id: 3,
                attempt_number: 1,
                started_at: '2026-03-01T10:00:00Z',
                submitted_at: null,
                questions: mockQuizData.questions,
            });
        });

        mockSubmitMutate.mockImplementation(({ payload }, options) => {
            options?.onSuccess?.({
                attempt_id: 100,
                score: 50,
                passing_grade: 70,
                passed: false,
                submitted_at: '2026-03-01T10:05:00Z',
            });
        });

        renderQuizPage();

        fireEvent.click(screen.getByTestId('start-quiz-btn'));
        fireEvent.click(screen.getByTestId('question-option-101'));
        fireEvent.click(screen.getByTestId('submit-quiz-btn'));

        // Result Card with failed score
        expect(screen.getByTestId('quiz-score-value')).toHaveTextContent('50%');
        expect(screen.getByText(/assessment failed/i)).toBeInTheDocument();

        // Retake CTA is available
        const retakeBtn = screen.getByTestId('retake-quiz-btn');
        expect(retakeBtn).toBeInTheDocument();

        // Clicking Retake re-invokes startAttempt
        fireEvent.click(retakeBtn);
        expect(mockStartMutate).toHaveBeenCalledTimes(2);
    });

    it('toggles post-submission review and renders QuizReviewViewer', () => {
        mockStartMutate.mockImplementation((_quizId, options) => {
            options?.onSuccess?.({
                id: 100,
                quiz_id: 1,
                user_id: 3,
                attempt_number: 1,
                started_at: '2026-03-01T10:00:00Z',
                submitted_at: null,
                questions: mockQuizData.questions,
            });
        });

        mockSubmitMutate.mockImplementation(({ payload }, options) => {
            options?.onSuccess?.({
                attempt_id: 100,
                score: 100,
                passing_grade: 70,
                passed: true,
                submitted_at: '2026-03-01T10:05:00Z',
            });
        });

        mockUseQuizAttempt.mockReturnValue({
            data: {
                id: 100,
                quiz_id: 1,
                user_id: 3,
                attempt_number: 1,
                score: 100,
                passed: true,
                started_at: '2026-03-01T10:00:00Z',
                submitted_at: '2026-03-01T10:05:00Z',
                questions: mockQuizData.questions.map((q) => ({
                    ...q,
                    options: q.options.map((opt, idx) => ({
                        ...opt,
                        is_correct: idx === 1,
                    })),
                })),
                answers: [
                    { id: 1, attempt_id: 100, question_id: 10, option_id: 102 },
                    { id: 2, attempt_id: 100, question_id: 20, option_id: 201 },
                ],
            },
            isLoading: false,
            isError: false,
            error: null,
            refetch: vi.fn(),
        } as any);

        renderQuizPage();

        fireEvent.click(screen.getByTestId('start-quiz-btn'));
        fireEvent.click(screen.getByTestId('question-option-102'));
        fireEvent.click(screen.getByTestId('submit-quiz-btn'));

        // Toggle review
        const toggleReviewBtn = screen.getByTestId('toggle-review-btn');
        fireEvent.click(toggleReviewBtn);

        expect(screen.getByTestId('quiz-review-viewer')).toBeInTheDocument();
        expect(screen.getByText(/question-by-question review/i)).toBeInTheDocument();
    });

    it('displays error message when startAttempt fails with max attempts reached', () => {
        mockStartMutate.mockImplementation((_quizId, options) => {
            options?.onError?.({
                response: {
                    status: 422,
                    data: {
                        message: 'Maximum quiz attempts reached.',
                        errors: { quiz: ['Maximum quiz attempts reached.'] },
                    },
                },
            });
        });

        renderQuizPage();

        fireEvent.click(screen.getByTestId('start-quiz-btn'));

        expect(screen.getByText(/maximum quiz attempts reached/i)).toBeInTheDocument();
    });
});
