import React from 'react';
import { Link } from 'react-router-dom';
import { EmployeeDashboardData } from '../types';
import MetricCard from './MetricCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle2, Award, Sparkles, ArrowRight } from 'lucide-react';

interface EmployeeDashboardProps {
    data: EmployeeDashboardData;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ data }) => {
    const { total_courses, in_progress, completed, certificates } = data;

    // Client-side completion rate calculation per approved plan
    const completionRate = total_courses > 0
        ? Math.round((completed / total_courses) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* 4 Employee Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                    label="Total Courses"
                    value={total_courses}
                    icon={BookOpen}
                    accent="blue"
                    description="Total enrolled courses"
                />
                <MetricCard
                    label="In Progress"
                    value={in_progress}
                    icon={Clock}
                    accent="amber"
                    description="Active learning courses"
                />
                <MetricCard
                    label="Completed"
                    value={completed}
                    icon={CheckCircle2}
                    accent="emerald"
                    description="Courses finished"
                />
                <MetricCard
                    label="Certificates"
                    value={certificates}
                    icon={Award}
                    accent="purple"
                    description="Official certificates earned"
                />
            </div>

            {/* Learning Summary & Progress Overview */}
            {total_courses === 0 ? (
                /* Empty State Card */
                <Card className="border-dashed border-2 border-border bg-card/50">
                    <CardContent className="p-8 text-center space-y-3">
                        <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                No Course Enrollments Yet
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                You have not enrolled in any training courses yet. Once courses are published in the employee learning catalog, your progress and earned certificates will appear here.
                            </p>
                        </div>
                        <div className="pt-2">
                            <Button asChild size="sm" className="text-xs font-medium">
                                <Link to="/courses">
                                    <span>Browse Catalog</span>
                                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                /* Continue Learning & Progress Summary Card */
                <Card className="border-border bg-card">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <CardTitle className="text-lg">Continue Learning</CardTitle>
                                <CardDescription>
                                    Your learning journey completion overview
                                </CardDescription>
                            </div>
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {completionRate}% Overall Completion
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                                <span className="text-muted-foreground">Course Completion Rate</span>
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

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                            <div className="p-3 rounded-lg border border-border bg-muted/30">
                                <span className="text-xs font-medium text-muted-foreground">Enrolled Courses</span>
                                <p className="text-base font-bold text-foreground mt-0.5">{total_courses}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-muted/30">
                                <span className="text-xs font-medium text-muted-foreground">Still In Progress</span>
                                <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{in_progress}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border bg-muted/30">
                                <span className="text-xs font-medium text-muted-foreground">Verified Certificates</span>
                                <p className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">{certificates}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default EmployeeDashboard;

