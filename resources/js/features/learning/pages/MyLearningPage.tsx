import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useMyCourses from '../hooks/useMyCourses';
import useMyCertificates from '@/features/certificates/hooks/useMyCertificates';
import { EnrollmentStatus } from '../types';
import EnrolledCourseCard from '../components/EnrolledCourseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    GraduationCap,
    AlertCircle,
    RefreshCw,
    ArrowRight,
    Sparkles,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

type FilterTab = 'ALL' | EnrollmentStatus;

const STATUS_TABS: { label: string; value: FilterTab }[] = [
    { label: 'All Courses', value: 'ALL' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Enrolled', value: 'ENROLLED' },
    { label: 'Completed', value: 'COMPLETED' },
];

export const MyLearningPage: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<FilterTab>('ALL');
    const [page, setPage] = useState<number>(1);
    const perPage = 9;

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useMyCourses({
        page,
        per_page: perPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
    });

    const { data: certificatesData } = useMyCertificates();
    const certificates = certificatesData?.certificates || [];
    const certificatesByEnrollmentId = new Map<number, typeof certificates[0]>();
    certificates.forEach((cert) => {
        certificatesByEnrollmentId.set(cert.enrollment_id, cert);
    });

    const handleTabChange = (tab: FilterTab) => {
        setStatusFilter(tab);
        setPage(1);
    };

    const enrollments = data?.enrollments || [];
    const meta = data?.meta;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                    <GraduationCap className="h-6 w-6" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/90">
                        Employee Learning
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    My Learning
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                    Track your enrolled courses, monitor your completion progress, and continue your professional training programs.
                </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-lg border border-border/60 w-fit">
                {STATUS_TABS.map((tab) => {
                    const isActive = statusFilter === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isActive
                                ? 'bg-card text-foreground shadow-xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            {isLoading ? (
                /* Loading Skeleton */
                <div data-testid="my-learning-loading-skeleton" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-72 rounded-xl border border-border bg-card/40 p-4 space-y-4 animate-pulse"
                            >
                                <div className="h-36 w-full rounded-lg bg-muted/60" />
                                <div className="h-5 w-3/4 rounded-md bg-muted/60" />
                                <div className="h-4 w-1/2 rounded-md bg-muted/40" />
                                <div className="h-8 w-full rounded-md bg-muted/40 mt-4" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : isError ? (
                /* Error State */
                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                Failed to Load Enrolled Courses
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {error?.message ||
                                    'An unexpected error occurred while fetching your learning enrollments.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-1.5 text-xs font-medium"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Retry</span>
                        </Button>
                    </CardContent>
                </Card>
            ) : enrollments.length === 0 ? (
                /* Empty State */
                <Card className="border-dashed border-2 border-border bg-card/40 p-8 sm:p-12 text-center">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                {statusFilter === 'ALL'
                                    ? 'No Course Enrollments Found'
                                    : `No ${statusFilter.replace('_', ' ')} Courses`}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {statusFilter === 'ALL'
                                    ? 'You are not enrolled in any training courses yet. Explore our published course catalog to begin learning.'
                                    : `You do not have any courses matching the "${statusFilter.toLowerCase().replace('_', ' ')}" status.`}
                            </p>
                        </div>
                        {statusFilter === 'ALL' ? (
                            <Button asChild size="sm" className="text-xs font-semibold gap-1.5">
                                <Link to="/courses">
                                    <span>Browse Catalog</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTabChange('ALL')}
                                className="text-xs font-medium"
                            >
                                View All Courses
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                /* Enrolled Courses Grid & Pagination */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrollments.map((enrollment) => (
                            <EnrolledCourseCard
                                key={enrollment.id}
                                enrollment={enrollment}
                                certificate={certificatesByEnrollmentId.get(enrollment.id)}
                            />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {meta && meta.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                Showing page <span className="font-semibold text-foreground">{meta.current_page}</span> of{' '}
                                <span className="font-semibold text-foreground">{meta.last_page}</span> ({meta.total} total courses)
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.current_page <= 1 || isFetching}
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    className="h-8 px-3 text-xs gap-1"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    <span>Previous</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.current_page >= meta.last_page || isFetching}
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="h-8 px-3 text-xs gap-1"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyLearningPage;

