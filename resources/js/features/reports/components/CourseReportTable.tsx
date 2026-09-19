import React from 'react';
import { CourseReportItem } from '../types';
import { PaginationMeta } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface CourseReportTableProps {
    items: CourseReportItem[];
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    isFetching?: boolean;
}

export const CourseReportTable: React.FC<CourseReportTableProps> = ({
    items,
    meta,
    onPageChange,
    isFetching = false,
}) => {
    return (
        <div className="space-y-4" data-testid="course-report-table-container">
            <div className="border border-border/80 rounded-lg overflow-hidden bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse" data-testid="course-report-table">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th scope="col" className="py-3 px-4 sm:px-6">Course</th>
                                <th scope="col" className="py-3 px-3">Category</th>
                                <th scope="col" className="py-3 px-3">Status</th>
                                <th scope="col" className="py-3 px-3 text-center">Total Enrolled</th>
                                <th scope="col" className="py-3 px-3 text-center">In Progress</th>
                                <th scope="col" className="py-3 px-3 text-center">Completed</th>
                                <th scope="col" className="py-3 px-4 sm:px-6 min-w-[160px]">Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {items.map((item) => (
                                <tr
                                    key={item.course_id}
                                    className="hover:bg-muted/30 transition-colors"
                                    data-testid="course-report-row"
                                >
                                    <td className="py-3.5 px-4 sm:px-6">
                                        <div className="flex items-start gap-2.5">
                                            <span className="p-1 rounded bg-primary/10 text-primary mt-0.5 shrink-0 hidden sm:inline-block">
                                                <BookOpen className="h-3.5 w-3.5" />
                                            </span>
                                            <div>
                                                <div className="font-semibold text-foreground leading-snug">
                                                    {item.title}
                                                </div>
                                                <div className="text-[11px] font-mono text-muted-foreground pt-0.5">
                                                    /{item.slug}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-3">
                                        {item.category ? (
                                            <span className="inline-block px-2 py-0.5 rounded bg-muted text-[11px] font-medium text-foreground">
                                                {item.category.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <Badge
                                            variant={
                                                item.status === 'PUBLISHED'
                                                    ? 'default'
                                                    : item.status === 'ARCHIVED'
                                                        ? 'destructive'
                                                        : 'secondary'
                                            }
                                            className="text-[10px] uppercase font-bold tracking-wider"
                                        >
                                            {item.status}
                                        </Badge>
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-medium text-foreground">
                                        {item.total_enrollments}
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-medium text-muted-foreground">
                                        {item.in_progress_count}
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-medium text-foreground">
                                        {item.completed_count}
                                    </td>
                                    <td className="py-3.5 px-4 sm:px-6">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-foreground">
                                                    {item.completion_rate}%
                                                </span>
                                                <span className="text-[11px] text-muted-foreground">
                                                    {item.completed_count}/{item.total_enrollments}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min(item.completion_rate, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {meta.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-muted-foreground">
                    <p>
                        Showing page <span className="font-semibold text-foreground">{meta.current_page}</span> of{' '}
                        <span className="font-semibold text-foreground">{meta.last_page}</span> ({meta.total} total courses)
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.current_page <= 1 || isFetching}
                            onClick={() => onPageChange(meta.current_page - 1)}
                            className="h-8 px-3 text-xs gap-1"
                            data-testid="pagination-prev-btn"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span>Previous</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.current_page >= meta.last_page || isFetching}
                            onClick={() => onPageChange(meta.current_page + 1)}
                            className="h-8 px-3 text-xs gap-1"
                            data-testid="pagination-next-btn"
                        >
                            <span>Next</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseReportTable;
