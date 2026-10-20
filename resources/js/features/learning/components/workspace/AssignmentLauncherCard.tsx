import React from 'react';
import { Link } from 'react-router-dom';
import { ModuleOutlineActivity } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ClipboardList,
    Clock,
    Award,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    ArrowRight,
    MessageSquare,
} from 'lucide-react';

interface AssignmentLauncherCardProps {
    enrollmentId: number | string;
    activity: ModuleOutlineActivity;
}

export const AssignmentLauncherCard: React.FC<AssignmentLauncherCardProps> = ({
    enrollmentId,
    activity,
}) => {
    const status = activity.status;
    const isPassed = status === 'PASSED';
    const isUnderReview = status === 'SUBMITTED' || status === 'UNDER_REVIEW';
    const isNeedsRevision = status === 'NEEDS_REVISION';
    const latestSub = activity.latest_submission;

    const renderStatusBadge = () => {
        switch (status) {
            case 'PASSED':
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Passed</span>
                    </Badge>
                );
            case 'NEEDS_REVISION':
                return (
                    <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Needs Revision</span>
                    </Badge>
                );
            case 'SUBMITTED':
            case 'UNDER_REVIEW':
                return (
                    <Badge variant="secondary" className="gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Under Review</span>
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-xs">
                        Not Submitted
                    </Badge>
                );
        }
    };

    return (
        <Card className="border-border bg-card shadow-xs overflow-hidden" data-testid={`assignment-launcher-card-${activity.id}`}>
            <CardHeader className="p-5 pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                    Course Assignment
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

                    <div>{renderStatusBadge()}</div>
                </div>

                {activity.instructions && (
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-3">
                        {activity.instructions}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="p-5 space-y-4">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs">
                    <div>
                        <span className="text-muted-foreground block text-[11px]">Maximum Score</span>
                        <span className="font-semibold text-foreground">
                            {activity.max_score ? `${activity.max_score} pts` : '100 pts'}
                        </span>
                    </div>

                    <div>
                        <span className="text-muted-foreground block text-[11px]">Deadline</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {activity.due_at ? new Date(activity.due_at).toLocaleDateString() : 'No deadline'}
                        </span>
                    </div>

                    <div>
                        <span className="text-muted-foreground block text-[11px]">Submissions</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                            <RotateCcw className="h-3 w-3 text-muted-foreground" />
                            {activity.submission_count ?? 0} submitted
                        </span>
                    </div>
                </div>

                {/* Latest submission outcome & feedback */}
                {latestSub && (
                    <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-2 text-xs" data-testid="assignment-submission-summary">
                        <div className="flex items-center justify-between font-medium">
                            <span className="text-foreground">
                                Attempt #{latestSub.attempt_number}
                                {latestSub.score !== null && latestSub.score !== undefined && (
                                    <> &mdash; Score: <strong className="text-primary">{latestSub.score} pts</strong></>
                                )}
                            </span>
                            {latestSub.submitted_at && (
                                <span className="text-[11px] text-muted-foreground">
                                    {new Date(latestSub.submitted_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {latestSub.feedback && (
                            <div className="p-2.5 rounded-md bg-muted/40 border border-border/40 space-y-1">
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                                    <MessageSquare className="h-3 w-3 text-primary" />
                                    <span>Instructor Feedback:</span>
                                </div>
                                <p className="text-xs text-foreground italic">{latestSub.feedback}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CTA */}
                <div className="flex justify-end pt-2">
                    <Button asChild size="sm" className="text-xs font-semibold gap-1.5" data-testid="open-assignment-cta">
                        <Link to={`/my-learning/${enrollmentId}/assignments/${activity.id}`}>
                            <span>
                                {isPassed
                                    ? 'View Submission'
                                    : isUnderReview
                                        ? 'Check Status'
                                        : isNeedsRevision
                                            ? 'Submit Revision'
                                            : 'Open Assignment'}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AssignmentLauncherCard;
