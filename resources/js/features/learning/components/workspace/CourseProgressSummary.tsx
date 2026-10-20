import React from 'react';
import { LearningOverview } from '../../types';
import EnrollmentStatusBadge from '../EnrollmentStatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckCircle2 } from 'lucide-react';

interface CourseProgressSummaryProps {
    overview: LearningOverview;
    onContinueLearning?: () => void;
}

export const CourseProgressSummary: React.FC<CourseProgressSummaryProps> = ({
    overview,
    onContinueLearning,
}) => {
    const percentage = overview.overall_percentage ?? (overview as any).progress?.overall_percentage ?? 0;
    const isCompleted = overview.status === 'COMPLETED' || overview.is_course_completed || Boolean((overview as any).progress?.is_completed);

    return (
        <Card className="border-border bg-card shadow-xs" data-testid="course-progress-summary">
            <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Course Progress
                            </span>
                            <EnrollmentStatusBadge status={overview.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {overview.completed_required_activities} of {overview.total_required_activities} required activities completed
                            {overview.total_modules > 0 && ` across ${overview.completed_modules} of ${overview.total_modules} modules`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <span className="text-2xl font-bold text-foreground leading-none" data-testid="summary-percentage">
                                {percentage}%
                            </span>
                        </div>

                        {!isCompleted && overview.current_activity && onContinueLearning && (
                            <Button
                                size="sm"
                                onClick={onContinueLearning}
                                className="text-xs font-semibold gap-1.5 shrink-0"
                                data-testid="continue-learning-cta"
                            >
                                <PlayCircle className="h-3.5 w-3.5" />
                                <span>Continue Learning</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>

                {isCompleted && (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 pt-1">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>All course requirements fulfilled! Course successfully completed.</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CourseProgressSummary;
