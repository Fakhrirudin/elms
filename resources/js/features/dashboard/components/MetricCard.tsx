import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricAccent = 'blue' | 'emerald' | 'amber' | 'purple' | 'indigo' | 'rose';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    accent?: MetricAccent;
    description?: string;
    className?: string;
}

const ACCENT_STYLES: Record<MetricAccent, { bg: string; text: string; ring: string }> = {
    blue: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        ring: 'group-hover:border-blue-500/30',
    },
    emerald: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        ring: 'group-hover:border-emerald-500/30',
    },
    amber: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        ring: 'group-hover:border-amber-500/30',
    },
    purple: {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        ring: 'group-hover:border-purple-500/30',
    },
    indigo: {
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        ring: 'group-hover:border-indigo-500/30',
    },
    rose: {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-600 dark:text-rose-400',
        ring: 'group-hover:border-rose-500/30',
    },
};

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    icon: Icon,
    accent = 'blue',
    description,
    className,
}) => {
    const styles = ACCENT_STYLES[accent];

    return (
        <Card
            className={cn(
                'group relative overflow-hidden transition-all duration-200 hover:shadow-sm border-border bg-card',
                styles.ring,
                className
            )}
        >
            <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                            {label}
                        </p>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {value}
                        </div>
                        {description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 pt-0.5">
                                {description}
                            </p>
                        )}
                    </div>
                    <div
                        className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                            styles.bg,
                            styles.text
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MetricCard;

