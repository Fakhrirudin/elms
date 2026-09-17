import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardSkeletonProps {
    cardCount?: number;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ cardCount = 4 }) => {
    return (
        <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard metrics">
            {/* Header skeleton */}
            <div className="flex flex-col gap-3 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-56 sm:w-72" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-44" />
                </div>
            </div>

            {/* Metric cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: cardCount }).map((_, index) => (
                    <Card key={index} className="border-border bg-card">
                        <CardContent className="p-5 sm:p-6 flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-11 w-11 rounded-xl" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content area skeleton */}
            <Card className="border-border bg-card">
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full max-w-md" />
                    <div className="pt-2">
                        <Skeleton className="h-2.5 w-full rounded-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardSkeleton;

