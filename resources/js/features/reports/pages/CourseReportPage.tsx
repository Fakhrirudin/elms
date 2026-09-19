import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useCourseReport from '../hooks/useCourseReport';
import ReportNavTabs from '../components/ReportNavTabs';
import ReportHeader from '../components/ReportHeader';
import ReportFilterBar from '../components/ReportFilterBar';
import CourseReportTable from '../components/CourseReportTable';
import ReportSkeleton from '../components/ReportSkeleton';
import ReportEmptyState from '../components/ReportEmptyState';
import ReportAccessDenied from '../components/ReportAccessDenied';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Archived', value: 'ARCHIVED' },
];

export const CourseReportPage: React.FC = () => {
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(15);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useCourseReport(
        {
            page,
            per_page: pageSize,
            status: statusFilter === 'ALL' ? undefined : (statusFilter as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'),
        },
        { enabled: !isEmployee }
    );

    // 1. Role Boundary: Employee is forbidden from accessing course report
    if (isEmployee) {
        return <ReportAccessDenied reportName="Course Performance" />;
    }

    const handleStatusChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setPage(1);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1);
    };

    const isInstructor = user?.role === 'INSTRUCTOR';
    const scopeBadge = isInstructor ? 'Assigned Courses' : 'Organization Scope';

    return (
        <div className="space-y-6" data-testid="course-report-page">
            {/* Sub-Navigation Tabs */}
            <ReportNavTabs activeTab="courses" />

            {/* Report Header */}
            <ReportHeader
                title="Course Performance Report"
                description="Aggregated course enrollment statistics, active learners, and completion rates authoritative from the backend."
                scopeBadge={scopeBadge}
                totalCount={data?.meta?.total}
                countLabel="Courses"
                icon={BookOpen}
            />

            {/* Filter Bar */}
            <ReportFilterBar
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                statusOptions={STATUS_OPTIONS}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                isFetching={isFetching}
                onRefresh={() => refetch()}
            />

            {/* Content States */}
            {isLoading ? (
                <ReportSkeleton />
            ) : isError ? (
                error?.response?.status === 403 ? (
                    <ReportAccessDenied reportName="Course Performance" />
                ) : (
                    <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                        <CardContent className="space-y-4">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h3 className="text-base font-semibold text-foreground">
                                    Failed to Load Course Report
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    {error?.response?.data?.message || error?.message || 'Unable to connect to the reporting service.'}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                className="text-xs font-medium gap-1.5"
                                data-testid="report-retry-btn"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Retry</span>
                            </Button>
                        </CardContent>
                    </Card>
                )
            ) : !data?.items || data.items.length === 0 ? (
                <ReportEmptyState
                    title="No Courses Found"
                    description="No courses match the selected status filter or your current course assignment scope."
                    onReset={statusFilter !== 'ALL' ? () => handleStatusChange('ALL') : undefined}
                />
            ) : (
                <CourseReportTable
                    items={data.items}
                    meta={data.meta}
                    onPageChange={setPage}
                    isFetching={isFetching}
                />
            )}
        </div>
    );
};

export default CourseReportPage;
