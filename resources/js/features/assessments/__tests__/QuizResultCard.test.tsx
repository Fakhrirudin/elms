import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuizResultCard from '../components/QuizResultCard';
import { QuizSubmitResult } from '../types';

describe('QuizResultCard', () => {
    const passedResult: QuizSubmitResult = {
        attempt_id: 15,
        score: 100,
        passing_grade: 70,
        passed: true,
        submitted_at: '2026-03-01T10:15:00Z',
    };

    const failedResult: QuizSubmitResult = {
        attempt_id: 16,
        score: 50,
        passing_grade: 70,
        passed: false,
        submitted_at: '2026-03-01T10:20:00Z',
    };

    it('renders passed state with score, threshold, and congratulations', () => {
        render(
            <MemoryRouter>
                <QuizResultCard
                    result={passedResult}
                    enrollmentId={5}
                    attemptNumber={1}
                />
            </MemoryRouter>
        );

        expect(screen.getByTestId('quiz-result-badge')).toHaveTextContent(/assessment passed/i);
        expect(screen.getByTestId('quiz-score-value')).toHaveTextContent('100%');
        expect(screen.getByText('70%')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText(/congratulations! you passed/i)).toBeInTheDocument();
        expect(screen.queryByTestId('retake-quiz-btn')).not.toBeInTheDocument();
    });

    it('renders failed state and displays retake button when canRetry is true', () => {
        const handleRetake = vi.fn();

        render(
            <MemoryRouter>
                <QuizResultCard
                    result={failedResult}
                    enrollmentId={5}
                    attemptNumber={1}
                    canRetry={true}
                    onRetake={handleRetake}
                />
            </MemoryRouter>
        );

        expect(screen.getByTestId('quiz-result-badge')).toHaveTextContent(/assessment failed/i);
        expect(screen.getByTestId('quiz-score-value')).toHaveTextContent('50%');
        expect(screen.getByText(/passing score not met/i)).toBeInTheDocument();

        const retakeBtn = screen.getByTestId('retake-quiz-btn');
        expect(retakeBtn).toBeInTheDocument();
        fireEvent.click(retakeBtn);
        expect(handleRetake).toHaveBeenCalledTimes(1);
    });

    it('renders maximum attempts notice and hides retake button when canRetry is false on failure', () => {
        render(
            <MemoryRouter>
                <QuizResultCard
                    result={failedResult}
                    enrollmentId={5}
                    attemptNumber={3}
                    canRetry={false}
                />
            </MemoryRouter>
        );

        expect(screen.getByText(/maximum attempts reached/i)).toBeInTheDocument();
        expect(screen.queryByTestId('retake-quiz-btn')).not.toBeInTheDocument();
    });

    it('toggles review when Review Answers button is clicked', () => {
        const handleToggleReview = vi.fn();

        render(
            <MemoryRouter>
                <QuizResultCard
                    result={passedResult}
                    enrollmentId={5}
                    onToggleReview={handleToggleReview}
                    showReview={false}
                />
            </MemoryRouter>
        );

        const reviewBtn = screen.getByTestId('toggle-review-btn');
        expect(reviewBtn).toHaveTextContent(/review answers/i);

        fireEvent.click(reviewBtn);
        expect(handleToggleReview).toHaveBeenCalledTimes(1);
    });

    it('renders back to learning player link with correct enrollmentId', () => {
        render(
            <MemoryRouter>
                <QuizResultCard
                    result={passedResult}
                    enrollmentId={42}
                />
            </MemoryRouter>
        );

        const backLink = screen.getByRole('link', { name: /back to learning player/i });
        expect(backLink).toHaveAttribute('href', '/my-learning/42');
    });
});

