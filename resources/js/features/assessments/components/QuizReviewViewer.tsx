import React from 'react';
import useQuizAttempt from '../hooks/useQuizAttempt';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuizReviewViewerProps {
    attemptId: number | string;
}

export const QuizReviewViewer: React.FC<QuizReviewViewerProps> = ({ attemptId }) => {
    const { data: attempt, isLoading, isError, error, refetch } = useQuizAttempt(attemptId);

    if (isLoading) {
        return (
            <div className="space-y-4 p-6 rounded-xl border border-border bg-card animate-pulse">
                <div className="h-5 w-40 bg-muted/60 rounded-md" />
                <div className="h-28 w-full bg-muted/30 rounded-lg" />
                <div className="h-28 w-full bg-muted/30 rounded-lg" />
            </div>
        );
    }

    if (isError || !attempt) {
        return (
            <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/10 text-center space-y-3 text-xs sm:text-sm">
                <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
                <p className="text-destructive font-medium">
                    {error?.message || 'Unable to load attempt review answers.'}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="gap-1.5 text-xs"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                </Button>
            </div>
        );
    }

    const questions = attempt.questions || [];
    const answers = attempt.answers || [];

    return (
        <div className="space-y-4" data-testid="quiz-review-viewer">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">
                    Question-by-Question Review
                </h3>
                <span className="text-xs text-muted-foreground">
                    Attempt #{attempt.attempt_number}
                </span>
            </div>

            <div className="space-y-4">
                {questions.map((question, idx) => {
                    const chosenAnswer = answers.find((a) => a.question_id === question.id);
                    const chosenOptionId = chosenAnswer?.option_id;

                    return (
                        <Card
                            key={question.id}
                            className="border-border bg-card shadow-xs overflow-hidden"
                        >
                            <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b border-border/50">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-xs font-bold font-mono">
                                        {idx + 1}
                                    </span>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                                        {question.question}
                                    </CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="p-4 sm:p-5 space-y-2">
                                {question.options.map((option, optIdx) => {
                                    const isChosen = chosenOptionId === option.id;
                                    const isCorrect = option.is_correct === true;

                                    let containerStyle = 'border-border/60 bg-background text-muted-foreground';
                                    let badge = null;

                                    if (isChosen && isCorrect) {
                                        containerStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-medium';
                                        badge = (
                                            <Badge
                                                variant="secondary"
                                                className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] gap-1 shrink-0"
                                            >
                                                <Check className="h-3 w-3" />
                                                <span>Your Answer (Correct)</span>
                                            </Badge>
                                        );
                                    } else if (isChosen && !isCorrect) {
                                        containerStyle = 'border-rose-500/40 bg-rose-500/10 text-rose-950 dark:text-rose-100 font-medium';
                                        badge = (
                                            <Badge
                                                variant="secondary"
                                                className="bg-rose-500/20 text-rose-800 dark:text-rose-300 text-[10px] gap-1 shrink-0"
                                            >
                                                <X className="h-3 w-3" />
                                                <span>Your Answer (Incorrect)</span>
                                            </Badge>
                                        );
                                    } else if (!isChosen && isCorrect) {
                                        containerStyle = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200';
                                        badge = (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] gap-1 shrink-0"
                                            >
                                                <Check className="h-3 w-3" />
                                                <span>Correct Answer</span>
                                            </Badge>
                                        );
                                    }

                                    return (
                                        <div
                                            key={option.id}
                                            className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-3 ${containerStyle}`}
                                            data-testid={`review-option-${option.id}`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="font-mono font-bold text-muted-foreground">
                                                    {String.fromCharCode(65 + optIdx)}.
                                                </span>
                                                <span>{option.option_text}</span>
                                            </div>
                                            {badge}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizReviewViewer;

