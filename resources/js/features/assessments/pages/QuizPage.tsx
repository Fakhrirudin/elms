import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import useQuiz from '../hooks/useQuiz';
import useStartQuizAttempt from '../hooks/useStartQuizAttempt';
import useSubmitQuizAttempt from '../hooks/useSubmitQuizAttempt';
import { QuizAttempt, QuizSubmitResult } from '../types';
import QuizIntroCard from '../components/QuizIntroCard';
import QuestionItem from '../components/QuestionItem';
import QuizResultCard from '../components/QuizResultCard';
import QuizReviewViewer from '../components/QuizReviewViewer';
import QuizSkeleton from '../components/QuizSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    AlertCircle,
    RefreshCw,
    Send,
    HelpCircle,
    CheckCircle2,
    ShieldAlert,
} from 'lucide-react';

export const QuizPage: React.FC = () => {
    const { enrollmentId, quizId } = useParams<{ enrollmentId: string; quizId: string }>();
    const { user } = useAuth();

    // 1. Authoritative Quiz Definition & Question Set
    const {
        data: quiz,
        isLoading: isLoadingQuiz,
        isError: isErrorQuiz,
        error: errorQuiz,
        refetch: refetchQuiz,
    } = useQuiz(quizId);

    // 2. Mutations
    const startAttemptMutation = useStartQuizAttempt();
    const submitAttemptMutation = useSubmitQuizAttempt();

    // 3. In-Memory State (strictly runtime; no localStorage/persistence)
    const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [submissionResult, setSubmissionResult] = useState<QuizSubmitResult | null>(null);
    const [showReview, setShowReview] = useState<boolean>(false);
    const [startErrorMessage, setStartErrorMessage] = useState<string | null>(null);
    const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

    // Role Guard: Learner quizzes are strictly reserved for enrolled EMPLOYEE role
    if (user && user.role !== 'EMPLOYEE') {
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground -ml-2">
                    <Link to={enrollmentId ? `/my-learning/${enrollmentId}` : '/dashboard'}>
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Return</span>
                    </Link>
                </Button>

                <Card className="border-amber-500/30 bg-amber-500/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                            Employee Quiz Access Only
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                            Quiz taking is exclusively enabled for enrolled employees. Staff, Instructors, and Administrators manage assessments via course management tools.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Loading State
    if (isLoadingQuiz) {
        return <QuizSkeleton />;
    }

    // Error State (e.g. 403 Forbidden / Not enrolled / Draft quiz, or 404)
    if (isErrorQuiz || !quiz) {
        const statusCode = errorQuiz?.response?.status;
        const errorDetail =
            statusCode === 403
                ? 'You must be actively enrolled in this published course to view or take this assessment.'
                : errorQuiz?.response?.data?.message ||
                errorQuiz?.message ||
                'The requested quiz could not be loaded.';

        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground -ml-2">
                    <Link to={enrollmentId ? `/my-learning/${enrollmentId}` : '/my-learning'}>
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Learning Player</span>
                    </Link>
                </Button>

                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                {statusCode === 403 ? 'Access Restricted' : 'Quiz Not Found'}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {errorDetail}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchQuiz()}
                            className="inline-flex items-center gap-1.5 text-xs"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Retry</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handler: Start new attempt
    const handleStartAttempt = () => {
        if (!quizId) return;

        setStartErrorMessage(null);
        startAttemptMutation.mutate(quizId, {
            onSuccess: (attempt) => {
                setActiveAttempt(attempt);
                setSelectedAnswers({});
                setSubmissionResult(null);
                setShowReview(false);
                setSubmitErrorMessage(null);
            },
            onError: (err) => {
                const apiError = err.response?.data;
                const errorMsg =
                    apiError?.errors?.quiz?.[0] ||
                    apiError?.message ||
                    err.message ||
                    'Unable to start quiz attempt.';
                setStartErrorMessage(errorMsg);
            },
        });
    };

    // Handler: Select option
    const handleSelectOption = (questionId: number, optionId: number) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    // Handler: Submit attempt
    const handleSubmitQuiz = () => {
        if (!activeAttempt || !quizId) return;

        setSubmitErrorMessage(null);

        const answersArray = Object.entries(selectedAnswers).map(([qId, oId]) => ({
            question_id: Number(qId),
            option_id: Number(oId),
        }));

        submitAttemptMutation.mutate(
            {
                attemptId: activeAttempt.id,
                quizId,
                enrollmentId,
                payload: { answers: answersArray },
            },
            {
                onSuccess: (result) => {
                    setSubmissionResult(result);
                    setActiveAttempt(null);
                    setShowReview(false);
                },
                onError: (err) => {
                    const apiError = err.response?.data;
                    const errorMsg =
                        apiError?.errors?.attempt?.[0] ||
                        apiError?.errors?.answers?.[0] ||
                        apiError?.message ||
                        err.message ||
                        'Failed to submit quiz attempt.';
                    setSubmitErrorMessage(errorMsg);
                },
            }
        );
    };

    const questions = activeAttempt?.questions || quiz.questions || [];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;
    const hasUnanswered = answeredCount < totalQuestions;

    // =========================================================================
    // PHASE 3: RESULT & REVIEW VIEW
    // =========================================================================
    if (submissionResult) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <QuizResultCard
                    result={submissionResult}
                    enrollmentId={enrollmentId || ''}
                    attemptNumber={activeAttempt?.attempt_number}
                    canRetry={!submissionResult.passed}
                    onRetake={handleStartAttempt}
                    isRetrying={startAttemptMutation.isPending}
                    onToggleReview={() => setShowReview((prev) => !prev)}
                    showReview={showReview}
                />

                {showReview && (
                    <QuizReviewViewer attemptId={submissionResult.attempt_id} />
                )}
            </div>
        );
    }

    // =========================================================================
    // PHASE 2: ACTIVE ATTEMPT VIEW
    // =========================================================================
    if (activeAttempt) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto" data-testid="active-quiz-container">
                {/* Active Attempt Sticky / Header Card */}
                <Card className="border-border bg-card shadow-xs">
                    <CardHeader className="p-4 sm:p-6 pb-3 bg-muted/20 border-b border-border/50">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs font-semibold">
                                        Attempt #{activeAttempt.attempt_number}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        Passing Grade: {quiz.passing_grade}%
                                    </Badge>
                                </div>
                                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                                    {quiz.title}
                                </CardTitle>
                            </div>

                            <div className="text-right">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                                    <span>
                                        {answeredCount} of {totalQuestions} answered
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-secondary overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{
                                width: totalQuestions > 0 ? `${(answeredCount / totalQuestions) * 100}%` : '0%',
                            }}
                        />
                    </div>
                </Card>

                {/* Submission Error Banner if any */}
                {submitErrorMessage && (
                    <div
                        role="alert"
                        className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs sm:text-sm flex items-start gap-2.5"
                    >
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold">Submission failed</p>
                            <p className="text-destructive/90">{submitErrorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Questions List */}
                <div className="space-y-4">
                    {questions.map((question, idx) => (
                        <QuestionItem
                            key={question.id}
                            question={question}
                            index={idx}
                            selectedOptionId={selectedAnswers[question.id]}
                            onSelectOption={handleSelectOption}
                            disabled={submitAttemptMutation.isPending}
                        />
                    ))}
                </div>

                {/* Submission Action Bar */}
                <Card className="border-border bg-card p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {hasUnanswered ? (
                                <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>
                                        {totalQuestions - answeredCount} unanswered question(s) remaining
                                    </span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>All questions answered</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSubmitQuiz}
                                disabled={submitAttemptMutation.isPending || answeredCount === 0}
                                className="w-full sm:w-auto gap-2 text-xs font-semibold"
                                data-testid="submit-quiz-btn"
                            >
                                {submitAttemptMutation.isPending ? (
                                    <span>Submitting Answers...</span>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5" />
                                        <span>Submit Quiz</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // =========================================================================
    // PHASE 1: INTRO VIEW (default & safe reload state)
    // =========================================================================
    return (
        <QuizIntroCard
            quiz={quiz}
            enrollmentId={enrollmentId || ''}
            isStarting={startAttemptMutation.isPending}
            onStartAttempt={handleStartAttempt}
            errorMessage={startErrorMessage}
        />
    );
};

export default QuizPage;
