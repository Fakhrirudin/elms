import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface CourseSkeletonProps {
    count?: number;
}

export const CourseSkeleton: React.FC<CourseSkeletonProps> = ({ count = 8 }) => {
    const items = Array.from({ length: count }, (_, i) => i);

    return (
        <div
            data-testid="course-skeleton-grid"
            aria-label="Loading course catalog..."
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse"
        >
            {items.map((key) => (
                <Card
                    key={key}
                    className="flex flex-col h-full overflow-hidden border-border bg-card/60"
                >
                    {/* Thumbnail Skeleton */}
                    <div className="aspect-video w-full bg-muted/60" />

                    {/* Content Skeleton */}
                    <CardContent className="flex-1 p-4 sm:p-5 space-y-3">
                        <div className="space-y-2">
                            {/* Title lines */}
                            <div className="h-5 w-3/4 bg-muted/80 rounded-md" />
                            <div className="h-4 w-1/2 bg-muted/60 rounded-md" />
                        </div>

                        {/* Description lines */}
                        <div className="space-y-1.5 pt-1">
                            <div className="h-3 w-full bg-muted/50 rounded-sm" />
                            <div className="h-3 w-5/6 bg-muted/40 rounded-sm" />
                        </div>

                        {/* Meta row */}
                        <div className="pt-3 flex items-center justify-between border-t border-border/40">
                            <div className="h-3 w-16 bg-muted/50 rounded-sm" />
                            <div className="h-3 w-20 bg-muted/50 rounded-sm" />
                        </div>
                    </CardContent>

                    {/* Footer Button Skeleton */}
                    <CardFooter className="p-4 sm:p-5 pt-0">
                        <div className="h-8 w-full bg-muted/50 rounded-md" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

export default CourseSkeleton;

