import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import useQuizReport from '../hooks/useQuizReport';
import ReportNavTabs from '../components/ReportNavTabs';
import ReportHeader from '../components/ReportHeader';
import ReportFilterBar from '../components/ReportFilterBar';
import QuizReportTable from '../components/QuizReportTable';
import ReportSkeleton from '../components/ReportSkeleton';
import ReportEmptyState from '../components/ReportEmptyState';
import ReportAccessDenied from '../components/ReportAccessDenied';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const QuizReportPage: React.FC = () => {
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';
    const isInstructor = user?.role === 'INSTRUCTOR';

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(15);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuizReport(
        {
            page,
            per_page: pageSize,
        },
        { enabled: !isEmployee }
    );

    // 1. Role Boundary: Employee is forbidden from accessing quiz aggregate report
    if (isEmployee) {
        return <ReportAccessDenied reportName="Quiz Assessment" />;
    }

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setPage(1);
    };

    const scopeBadge = isInstructor ? 'Assigned Courses' : 'Organization Scope';

    return (
        <div className="space-y-6" data-testid="quiz-report-page">
            {/* Sub-Navigation Tabs */}
            <ReportNavTabs activeTab="quiz" />

            {/* Report Header */}
            <ReportHeader
                title="Quiz Performance Report"
                description="Authoritative assessment metrics including total attempts, pass rates, and score distributions from the backend."
                scopeBadge={scopeBadge}
                totalCount={data?.meta?.total}
                countLabel="Quizzes"
                icon={FileCheck}
            />

            {/* Filter Bar (Page Size Only, no score distribution) */}
            <ReportFilterBar
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
                    <ReportAccessDenied reportName="Quiz Assessment" />
                ) : (
                    <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                        <CardContent className="space-y-4">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h3 className="text-base font-semibold text-foreground">
                                    Failed to Load Quiz Report
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
                    title="No Quizzes Found"
                    description="No quiz evaluations match your current course assignment scope."
                />
            ) : (
                <QuizReportTable
                    items={data.items}
                    meta={data.meta}
                    onPageChange={setPage}
                    isFetching={isFetching}
                />
            )}
        </div>
    );
};

export default QuizReportPage;
