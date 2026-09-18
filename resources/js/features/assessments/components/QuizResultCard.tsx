import React from 'react';
import { Link } from 'react-router-dom';
import { QuizSubmitResult } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw, Eye, Award } from 'lucide-react';

interface QuizResultCardProps {
    result: QuizSubmitResult;
    enrollmentId: string | number;
    attemptNumber?: number;
    canRetry?: boolean;
    onRetake?: () => void;
    isRetrying?: boolean;
    onToggleReview?: () => void;
    showReview?: boolean;
}

export const QuizResultCard: React.FC<QuizResultCardProps> = ({
    result,
    enrollmentId,
    attemptNumber,
    canRetry = false,
    onRetake,
    isRetrying = false,
    onToggleReview,
    showReview = false,
}) => {
    const isPassed = result.passed;

    return (
        <Card
            className={`border shadow-xs overflow-hidden ${isPassed
                    ? 'border-emerald-500/30 bg-card'
                    : 'border-rose-500/30 bg-card'
                }`}
            data-testid="quiz-result-card"
        >
            <CardHeader
                className={`p-6 sm:p-8 text-center space-y-3 ${isPassed
                        ? 'bg-emerald-500/10 border-b border-emerald-500/20'
                        : 'bg-rose-500/10 border-b border-rose-500/20'
                    }`}
            >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-xs">
                    {isPassed ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <XCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                    )}
                </div>

                <div className="space-y-1">
                    <Badge
                        variant="secondary"
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 ${isPassed
                                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                            }`}
                        data-testid="quiz-result-badge"
                    >
                        {isPassed ? 'Assessment Passed' : 'Assessment Failed'}
                    </Badge>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                        {isPassed
                            ? 'Congratulations! You Passed'
                            : 'Passing Score Not Met'}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                        {isPassed
                            ? 'You have demonstrated mastery of the module curriculum. This requirement for course completion is fulfilled.'
                            : 'You did not achieve the required passing score for this assessment attempt.'}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Score & Threshold Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Your Score</span>
                        <div
                            className={`text-2xl sm:text-3xl font-black ${isPassed
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                            data-testid="quiz-score-value"
                        >
                            {result.score}%
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Passing Grade</span>
                        <div className="text-2xl sm:text-3xl font-black text-foreground">
                            {result.passing_grade}%
                        </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-4 rounded-xl border border-border bg-muted/20 text-center space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">Attempt Record</span>
                        <div className="text-2xl sm:text-3xl font-black text-foreground">
                            {attemptNumber ? `#${attemptNumber}` : 'Submitted'}
                        </div>
                    </div>
                </div>

                {/* Status Notice */}
                {!isPassed && canRetry && (
                    <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-1">
                        <p className="font-semibold">Review your materials and try again</p>
                        <p className="text-amber-800/90 dark:text-amber-300/90">
                            You have attempts remaining. You may retake this quiz to achieve a passing score.
                        </p>
                    </div>
                )}

                {!isPassed && !canRetry && (
                    <div className="p-4 rounded-lg border border-muted bg-muted/50 text-muted-foreground text-xs sm:text-sm space-y-1">
                        <p className="font-semibold text-foreground">Maximum attempts reached</p>
                        <p>
                            You have used all allowed attempts for this quiz. Please reach out to your instructor or learning administrator.
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-6 sm:p-8 pt-0 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5">
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-medium"
                >
                    <Link to={`/my-learning/${enrollmentId}`}>
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Learning Player</span>
                    </Link>
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                    {onToggleReview && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={onToggleReview}
                            className="gap-1.5 text-xs font-medium"
                            data-testid="toggle-review-btn"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{showReview ? 'Hide Answers' : 'Review Answers'}</span>
                        </Button>
                    )}

                    {!isPassed && canRetry && onRetake && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onRetake}
                            disabled={isRetrying}
                            className="gap-1.5 text-xs font-semibold"
                            data-testid="retake-quiz-btn"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>{isRetrying ? 'Starting Attempt...' : 'Retake Quiz'}</span>
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

export default QuizResultCard;

