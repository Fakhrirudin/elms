import React from 'react';
import { LearningReportItem } from '../types';
import { PaginationMeta } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, User, Calendar, CheckCircle2 } from 'lucide-react';

interface LearningReportTableProps {
    items: LearningReportItem[];
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    isFetching?: boolean;
    isEmployeeView?: boolean;
}

export const LearningReportTable: React.FC<LearningReportTableProps> = ({
    items,
    meta,
    onPageChange,
    isFetching = false,
    isEmployeeView = false,
}) => {
    return (
        <div className="space-y-4" data-testid="learning-report-table-container">
            <div className="border border-border/80 rounded-lg overflow-hidden bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse" data-testid="learning-report-table">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                {!isEmployeeView && <th scope="col" className="py-3 px-4 sm:px-6">Employee</th>}
                                <th scope="col" className="py-3 px-4 sm:px-6">Course</th>
                                <th scope="col" className="py-3 px-3">Status</th>
                                <th scope="col" className="py-3 px-4 sm:px-6 min-w-[160px]">Progress</th>
                                <th scope="col" className="py-3 px-3">Enrolled At</th>
                                <th scope="col" className="py-3 px-3">Completed At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {items.map((item) => {
                                const enrolledDate = item.enrolled_at
                                    ? new Date(item.enrolled_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })
                                    : '—';

                                const completedDate = item.completed_at
                                    ? new Date(item.completed_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })
                                    : null;

                                return (
                                    <tr
                                        key={item.enrollment_id}
                                        className="hover:bg-muted/30 transition-colors"
                                        data-testid="learning-report-row"
                                    >
                                        {!isEmployeeView && (
                                            <td className="py-3.5 px-4 sm:px-6">
                                                <div className="flex items-start gap-2.5">
                                                    <span className="p-1 rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                                                        <User className="h-3.5 w-3.5" />
                                                    </span>
                                                    <div>
                                                        <div className="font-semibold text-foreground leading-snug">
                                                            {item.employee.name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground pt-0.5">
                                                            {item.employee.department || 'General'}
                                                            {item.employee.nip ? ` • NIP: ${item.employee.nip}` : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">
                                            {item.course.title}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <Badge
                                                variant={
                                                    item.status === 'COMPLETED'
                                                        ? 'default'
                                                        : item.status === 'IN_PROGRESS'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                                className="text-[10px] uppercase font-bold tracking-wider"
                                            >
                                                {item.status.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-foreground">
                                                        {item.progress}%
                                                    </span>
                                                    {item.status === 'COMPLETED' && (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                                    )}
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(item.progress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                                                <span>{enrolledDate}</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                            {completedDate ? (
                                                <div className="flex items-center gap-1 font-medium text-foreground">
                                                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                                    <span>{completedDate}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground/70 italic text-[11px]">
                                                    In progress
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {meta.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-muted-foreground">
                    <p>
                        Showing page <span className="font-semibold text-foreground">{meta.current_page}</span> of{' '}
                        <span className="font-semibold text-foreground">{meta.last_page}</span> ({meta.total} total records)
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

export default LearningReportTable;
