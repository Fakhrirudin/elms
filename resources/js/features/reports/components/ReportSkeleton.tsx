import React from 'react';

export const ReportSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-pulse" data-testid="report-skeleton">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                <div className="space-y-2">
                    <div className="h-7 w-64 bg-muted rounded-md" />
                    <div className="h-4 w-96 bg-muted/60 rounded-md" />
                </div>
                <div className="h-7 w-32 bg-muted rounded-full self-start sm:self-center" />
            </div>

            {/* Filter Bar Skeleton */}
            <div className="h-14 w-full bg-muted/40 rounded-lg border border-border/60" />

            {/* Table Skeleton */}
            <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
                <div className="h-10 bg-muted/50 border-b border-border" />
                <div className="divide-y divide-border/60 p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 py-2">
                            <div className="h-4 w-1/3 bg-muted/60 rounded-md" />
                            <div className="h-4 w-20 bg-muted/50 rounded-md" />
                            <div className="h-4 w-16 bg-muted/50 rounded-md" />
                            <div className="h-4 w-28 bg-muted/70 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReportSkeleton;
