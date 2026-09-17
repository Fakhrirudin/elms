import React from 'react';
import { InstructorDashboardData } from '../types';
import MetricCard from './MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GraduationCap, Users, CheckSquare, TrendingUp, Info } from 'lucide-react';

interface InstructorDashboardProps {
    data: InstructorDashboardData;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ data }) => {
    const { assigned_courses, total_enrollments, completed_courses, average_quiz_score } = data;

    const formattedScore = typeof average_quiz_score === 'number'
        ? `${average_quiz_score.toFixed(1)}%`
        : '0.0%';

    return (
        <div className="space-y-8">
            {/* 4 Instructor Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                    label="Assigned Courses"
                    value={assigned_courses}
                    icon={GraduationCap}
                    accent="indigo"
                    description="Courses assigned to teach"
                />
                <MetricCard
                    label="Total Enrollments"
                    value={total_enrollments}
                    icon={Users}
                    accent="blue"
                    description="Learners in your courses"
                />
                <MetricCard
                    label="Learner Completions"
                    value={completed_courses}
                    icon={CheckSquare}
                    accent="emerald"
                    description="Course completions"
                />
                <MetricCard
                    label="Average Quiz Score"
                    value={formattedScore}
                    icon={TrendingUp}
                    accent="amber"
                    description="Submitted attempts average"
                />
            </div>

            {/* Teaching Performance Summary */}
            <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Teaching & Course Performance</CardTitle>
                    <CardDescription>
                        Overview of learner engagement and assessment metrics for your courses
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Learner Completion Rate
                            </span>
                            <div className="text-xl font-bold text-foreground">
                                {total_enrollments > 0
                                    ? `${Math.round((completed_courses / total_enrollments) * 100)}%`
                                    : '0%'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {completed_courses} of {total_enrollments} enrolled learners finished their coursework
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Assessment Average
                            </span>
                            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {formattedScore}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Calculated across all submitted quiz assessments in assigned courses
                            </p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs text-muted-foreground">
                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="leading-relaxed">
                            These figures are dynamically aggregated from submitted attempts and enrollment completions in your assigned curriculum modules.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default InstructorDashboard;

