import React from 'react';
import { AdminDashboardData } from '../types';
import MetricCard from './MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Library, Globe, Users2, Trophy, BarChart3, ShieldCheck } from 'lucide-react';

interface AdminDashboardProps {
    data: AdminDashboardData;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
    const {
        total_employees,
        total_courses,
        published_courses,
        total_enrollments,
        completed_courses,
        average_quiz_score,
    } = data;

    const formattedScore = typeof average_quiz_score === 'number'
        ? `${average_quiz_score.toFixed(1)}%`
        : '0.0%';

    // Catalog publication rate and completion rate from existing metrics
    const publicationRate = total_courses > 0
        ? Math.round((published_courses / total_courses) * 100)
        : 0;

    const completionRate = total_enrollments > 0
        ? Math.round((completed_courses / total_enrollments) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* 6 Institutional Admin Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <MetricCard
                    label="Total Employees"
                    value={total_employees}
                    icon={Users}
                    accent="purple"
                    description="Active registered staff"
                />
                <MetricCard
                    label="Total Courses"
                    value={total_courses}
                    icon={Library}
                    accent="blue"
                    description="Curriculum catalog count"
                />
                <MetricCard
                    label="Published Courses"
                    value={published_courses}
                    icon={Globe}
                    accent="emerald"
                    description="Available to enroll"
                />
                <MetricCard
                    label="Total Enrollments"
                    value={total_enrollments}
                    icon={Users2}
                    accent="indigo"
                    description="System-wide enrollments"
                />
                <MetricCard
                    label="Completed Courses"
                    value={completed_courses}
                    icon={Trophy}
                    accent="rose"
                    description="Total employee completions"
                />
                <MetricCard
                    label="Average Quiz Score"
                    value={formattedScore}
                    icon={BarChart3}
                    accent="amber"
                    description="System-wide quiz average"
                />
            </div>

            {/* Institutional Learning Health Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border bg-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">Catalog Status</CardTitle>
                        <CardDescription>
                            Distribution of training materials and availability
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                                <span className="text-muted-foreground">Publication Rate</span>
                                <span className="text-foreground font-semibold">{publicationRate}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${publicationRate}%` }}
                                    role="progressbar"
                                    aria-valuenow={publicationRate}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-lg border border-border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Published</span>
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{published_courses}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Draft / Unpublished</span>
                                <p className="text-lg font-bold text-muted-foreground mt-0.5">{Math.max(0, total_courses - published_courses)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">Institutional Performance</CardTitle>
                        <CardDescription>
                            System-wide learner completion and evaluation
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                                <span className="text-muted-foreground">Overall Completion Rate</span>
                                <span className="text-foreground font-semibold">{completionRate}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${completionRate}%` }}
                                    role="progressbar"
                                    aria-valuenow={completionRate}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-lg border border-border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Completions</span>
                                <p className="text-lg font-bold text-foreground mt-0.5">{completed_courses}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-muted/20">
                                <span className="text-xs text-muted-foreground">Assessment Average</span>
                                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formattedScore}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;

