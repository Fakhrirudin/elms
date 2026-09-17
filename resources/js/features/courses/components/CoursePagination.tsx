import React from 'react';
import { PaginationMeta } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CoursePaginationProps {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    isFetching?: boolean;
}

export const CoursePagination: React.FC<CoursePaginationProps> = ({
    meta,
    onPageChange,
    isFetching = false,
}) => {
    const { current_page, last_page, total, per_page } = meta;

    if (total === 0 || last_page <= 1) {
        return null;
    }

    const startItem = (current_page - 1) * per_page + 1;
    const endItem = Math.min(current_page * per_page, total);

    return (
        <div
            data-testid="course-pagination"
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border"
        >
            {/* Info Summary */}
            <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
                <span className="font-medium text-foreground">{endItem}</span> of{' '}
                <span className="font-medium text-foreground">{total}</span> courses
            </p>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(current_page - 1)}
                    disabled={current_page <= 1 || isFetching}
                    className="h-8 px-2.5 text-xs flex items-center gap-1"
                    aria-label="Go to previous page"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                </Button>

                {/* Page Indicator */}
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/40 rounded-md border border-border">
                    Page <span className="text-foreground font-semibold">{current_page}</span> of{' '}
                    <span className="text-foreground font-semibold">{last_page}</span>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(current_page + 1)}
                    disabled={current_page >= last_page || isFetching}
                    className="h-8 px-2.5 text-xs flex items-center gap-1"
                    aria-label="Go to next page"
                >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
};

export default CoursePagination;

