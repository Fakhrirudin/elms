import React from 'react';
import { QuizReportItem } from '../types';
import { PaginationMeta } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileCheck, CheckCircle, XCircle } from 'lucide-react';

interface QuizReportTableProps {
    items: QuizReportItem[];
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    isFetching?: boolean;
}

export const QuizReportTable: React.FC<QuizReportTableProps> = ({
    items,
    meta,
    onPageChange,
    isFetching = false,
}) => {
    return (
        <div className="space-y-4" data-testid="quiz-report-table-container">
            <div className="border border-border/80 rounded-lg overflow-hidden bg-card shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left border-collapse" data-testid="quiz-report-table">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                            <tr>
                                <th scope="col" className="py-3 px-4 sm:px-6">Quiz Assessment</th>
                                <th scope="col" className="py-3 px-3">Course</th>
                                <th scope="col" className="py-3 px-3 text-center">Passing Grade</th>
                                <th scope="col" className="py-3 px-3 text-center">Attempts</th>
                                <th scope="col" className="py-3 px-3 text-center">Passed / Failed</th>
                                <th scope="col" className="py-3 px-3 text-center">Pass Rate</th>
                                <th scope="col" className="py-3 px-3 text-center">Avg Score</th>
                                <th scope="col" className="py-3 px-4 sm:px-6 text-center">Min / Max Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {items.map((item) => (
                                <tr
                                    key={item.quiz_id}
                                    className="hover:bg-muted/30 transition-colors"
                                    data-testid="quiz-report-row"
                                >
                                    <td className="py-3.5 px-4 sm:px-6">
                                        <div className="flex items-start gap-2.5">
                                            <span className="p-1 rounded bg-primary/10 text-primary mt-0.5 shrink-0 hidden sm:inline-block">
                                                <FileCheck className="h-3.5 w-3.5" />
                                            </span>
                                            <div>
                                                <div className="font-semibold text-foreground leading-snug">
                                                    {item.quiz_title}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground pt-0.5">
                                                    ID: #{item.quiz_id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-3 font-medium text-foreground">
                                        {item.course.title}
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                        <Badge variant="outline" className="text-xs font-mono font-semibold">
                                            {item.passing_grade}%
                                        </Badge>
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-medium text-foreground">
                                        {item.total_attempts}
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                        <div className="inline-flex items-center gap-2 text-xs">
                                            <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                <CheckCircle className="h-3 w-3" />
                                                {item.total_passed}
                                            </span>
                                            <span className="text-muted-foreground">/</span>
                                            <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
                                                <XCircle className="h-3 w-3" />
                                                {item.total_failed}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-3 text-center">
                                        <span
                                            className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                                                item.pass_rate >= item.passing_grade
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            }`}
                                        >
                                            {item.pass_rate}%
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-semibold font-mono text-foreground">
                                        {item.average_score}
                                    </td>
                                    <td className="py-3.5 px-4 sm:px-6 text-center text-xs font-mono text-muted-foreground">
                                        <span className="text-rose-600 dark:text-rose-400 font-medium">{item.min_score}</span>
                                        <span className="mx-1.5">—</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{item.max_score}</span>
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
                        <span className="font-semibold text-foreground">{meta.last_page}</span> ({meta.total} total quizzes)
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

export default QuizReportTable;
