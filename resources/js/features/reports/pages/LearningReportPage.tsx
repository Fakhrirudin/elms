import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useLearningReport from '../hooks/useLearningReport';
import ReportNavTabs from '../components/ReportNavTabs';
import ReportHeader from '../components/ReportHeader';
import ReportFilterBar from '../components/ReportFilterBar';
import LearningReportTable from '../components/LearningReportTable';
import ReportSkeleton from '../components/ReportSkeleton';
import ReportEmptyState from '../components/ReportEmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, AlertCircle, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Enrolled', value: 'ENROLLED' },
];

export const LearningReportPage: React.FC = () => {
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';
    const isInstructor = user?.role === 'INSTRUCTOR';

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
    } = useLearningReport({
        page,
        per_page: pageSize,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED'),
    });

    const handleStatusChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setPage(1);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1);
    };

    const scopeBadge = isEmployee
        ? 'Personal Learning Record'
        : isInstructor
            ? 'Student Progress (Assigned Courses)'
            : 'Organization Scope';

    const reportDescription = isEmployee
        ? 'Authoritative progress percentages and completion timeline across your enrolled training programs.'
        : isInstructor
            ? 'Learner progress and completion timeline for students enrolled in your assigned training courses.'
            : 'Comprehensive employee enrollment records and curriculum completion progress across all departments.';

    return (
        <div className="space-y-6" data-testid="learning-report-page">
            {/* Sub-Navigation Tabs */}
            <ReportNavTabs activeTab="learning" />

            {/* Report Header */}
            <ReportHeader
                title={isEmployee ? 'My Learning Progress' : 'Learning Progress Report'}
                description={reportDescription}
                scopeBadge={scopeBadge}
                totalCount={data?.meta?.total}
                countLabel={isEmployee ? 'Enrolled Courses' : 'Enrollments'}
                icon={GraduationCap}
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
                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                Failed to Load Learning Report
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
            ) : !data?.items || data.items.length === 0 ? (
                <ReportEmptyState
                    title={isEmployee ? 'No Learning Records Found' : 'No Enrollments Found'}
                    description={
                        isEmployee
                            ? 'You do not have any enrollments matching the selected filter.'
                            : 'No student enrollments match the selected filter criteria.'
                    }
                    onReset={statusFilter !== 'ALL' ? () => handleStatusChange('ALL') : undefined}
                />
            ) : (
                <LearningReportTable
                    items={data.items}
                    meta={data.meta}
                    onPageChange={setPage}
                    isFetching={isFetching}
                    isEmployeeView={isEmployee}
                />
            )}
        </div>
    );
};

export default LearningReportPage;
