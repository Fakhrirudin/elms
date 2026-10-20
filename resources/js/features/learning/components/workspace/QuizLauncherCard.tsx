import React from 'react';
import { Link } from 'react-router-dom';
import { ModuleOutlineActivity } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    HelpCircle,
    Clock,
    RotateCcw,
    Award,
    CheckCircle2,
    XCircle,
    ArrowRight,
} from 'lucide-react';

interface QuizLauncherCardProps {
    enrollmentId: number | string;
    activity: ModuleOutlineActivity;
}

export const QuizLauncherCard: React.FC<QuizLauncherCardProps> = ({
    enrollmentId,
    activity,
}) => {
    const isPassed = activity.status === 'PASSED';
    const isFailed = activity.status === 'FAILED';
    const latestAttempt = activity.latest_attempt;
    const attemptsCount = activity.attempts_count ?? 0;
    const maxAttempts = activity.max_attempts ?? 1;
    const attemptsRemaining = Math.max(0, maxAttempts - attemptsCount);
    const canAttempt = attemptsRemaining > 0 || maxAttempts === 0;

    return (
        <Card className="border-border bg-card shadow-xs overflow-hidden" data-testid={`quiz-launcher-card-${activity.id}`}>
            <CardHeader className="p-5 pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <HelpCircle className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                    Quiz Assessment
                                </span>
                                {activity.is_required && (
                                    <Badge variant="secondary" className="text-[10px] py-0 h-4">
                                        Required
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
                                {activity.title}
                            </CardTitle>
                        </div>
                    </div>

                    <div>
                        {isPassed ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Passed</span>
                            </Badge>
                        ) : isFailed ? (
                            <Badge variant="destructive" className="gap-1 text-xs">
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Not Passed</span>
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-xs">
                                Available
                            </Badge>
                        )}
                    </div>
                </div>

                {activity.description && (
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-2">
                        {activity.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="p-5 space-y-4">
                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
                    <div>
                        <span className="text-muted-foreground block text-[11px]">Passing Score</span>
                        <span className="font-semibold text-foreground">
                            {activity.passing_grade ? `${activity.passing_grade}%` : '70%'}
                        </span>
                    </div>

                    <div>
                        <span className="text-muted-foreground block text-[11px]">Time Limit</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {activity.time_limit_minutes ? `${activity.time_limit_minutes} mins` : 'Untimed'}
                        </span>
                    </div>

                    <div>
                        <span className="text-muted-foreground block text-[11px]">Attempts</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            <RotateCcw className="h-3 w-3 text-muted-foreground" />
                            {attemptsCount} / {maxAttempts} used
                        </span>
                    </div>
                </div>

                {/* Latest attempt outcome if exists */}
                {latestAttempt && (
                    <div
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${latestAttempt.passed
                                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300'
                                : 'border-destructive/30 bg-destructive/5 text-destructive'
                            }`}
                        data-testid="quiz-latest-attempt-result"
                    >
                        <div className="flex items-center gap-2">
                            {latestAttempt.passed ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            ) : (
                                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                            )}
                            <span>
                                Attempt #{latestAttempt.attempt_number}: Score{' '}
                                <strong>{latestAttempt.score ?? 0}%</strong>
                            </span>
                        </div>
                        {latestAttempt.submitted_at && (
                            <span className="text-[11px] text-muted-foreground">
                                {new Date(latestAttempt.submitted_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                )}

                {/* CTA */}
                <div className="flex justify-end pt-2">
                    <Button asChild size="sm" className="text-xs font-semibold gap-1.5" data-testid="start-quiz-cta">
                        <Link to={`/my-learning/${enrollmentId}/quizzes/${activity.id}`}>
                            <span>
                                {isPassed
                                    ? 'Review Quiz'
                                    : attemptsCount > 0
                                        ? 'Retake Quiz'
                                        : 'Start Quiz'}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default QuizLauncherCard;
