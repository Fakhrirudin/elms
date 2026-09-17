import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface DashboardErrorProps {
    message?: string;
    onRetry?: () => void;
    isRetrying?: boolean;
}

export const DashboardError: React.FC<DashboardErrorProps> = ({
    message = 'Unable to load dashboard metrics. Please check your network connection and try again.',
    onRetry,
    isRetrying = false,
}) => {
    return (
        <Card className="border-destructive/20 bg-destructive/5 text-card-foreground">
            <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 max-w-md">
                    <h3 className="text-base font-semibold text-foreground">
                        Failed to Load Dashboard
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {message}
                    </p>
                </div>
                {onRetry && (
                    <div className="pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            disabled={isRetrying}
                            className="flex items-center gap-2"
                        >
                            <RotateCcw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DashboardError;

