import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface ReportHeaderProps {
    title: string;
    description: string;
    scopeBadge?: string;
    totalCount?: number;
    countLabel?: string;
    icon?: LucideIcon;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
    title,
    description,
    scopeBadge,
    totalCount,
    countLabel = 'Records',
    icon: Icon,
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                        </span>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {scopeBadge && (
                        <Badge variant="outline" className="text-[11px] font-medium border-primary/30 text-primary bg-primary/5">
                            {scopeBadge}
                        </Badge>
                    )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
                    {description}
                </p>
            </div>

            {typeof totalCount === 'number' && (
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold" data-testid="report-total-count">
                        <span>Total {countLabel}: {totalCount}</span>
                    </Badge>
                </div>
            )}
        </div>
    );
};

export default ReportHeader;
