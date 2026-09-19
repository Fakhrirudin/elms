import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter } from 'lucide-react';

interface ReportFilterBarProps {
    statusFilter?: string;
    onStatusChange?: (status: string) => void;
    statusOptions?: { label: string; value: string }[];
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    isFetching?: boolean;
    onRefresh?: () => void;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
    statusFilter,
    onStatusChange,
    statusOptions,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 15, 25, 50],
    isFetching = false,
    onRefresh,
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border/80 shadow-xs">
            {/* Status Filter Tabs (if available) */}
            {statusOptions && onStatusChange && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                        <Filter className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Filter:</span>
                    </div>
                    {statusOptions.map((opt) => {
                        const isSelected = statusFilter === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onStatusChange(opt.value)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    isSelected
                                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                                data-testid={`filter-status-${opt.value}`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Page Size & Refresh Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-3 ml-auto">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Show:</span>
                    <select
                        aria-label="Items per page"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="h-8 px-2 rounded-md bg-background border border-input text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                        data-testid="page-size-select"
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size} / page
                            </option>
                        ))}
                    </select>
                </div>

                {onRefresh && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isFetching}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Refresh report data"
                        data-testid="report-refresh-btn"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ReportFilterBar;
