import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, RotateCcw } from 'lucide-react';

interface ReportEmptyStateProps {
    title?: string;
    description?: string;
    onReset?: () => void;
}

export const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({
    title = 'No Report Records Found',
    description = 'There are no records matching your current filter criteria or scope.',
    onReset,
}) => {
    return (
        <Card className="border-dashed border-2 border-border bg-card/40 p-8 sm:p-12 text-center" data-testid="report-empty-state">
            <CardContent className="space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileQuestion className="h-6 w-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-semibold text-foreground">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                {onReset && (
                    <div className="pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onReset}
                            className="text-xs font-medium gap-1.5"
                            data-testid="report-reset-filters-btn"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Reset Filters</span>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ReportEmptyState;
