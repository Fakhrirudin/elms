import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ReportAccessDeniedProps {
    reportName?: string;
}

export const ReportAccessDenied: React.FC<ReportAccessDeniedProps> = ({
    reportName = 'this analytics',
}) => {
    return (
        <div className="space-y-6 max-w-2xl mx-auto py-6" data-testid="report-access-denied">
            <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12 shadow-xs">
                <CardContent className="space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <ShieldAlert className="h-7 w-7" />
                    </div>
                    <div className="space-y-2 max-w-md mx-auto">
                        <h2 className="text-base sm:text-lg font-semibold text-foreground">
                            Access Denied
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            You do not have permission to view {reportName} reports. Employee accounts are restricted to personal learning progress records. Course performance and assessment analytics are reserved for instructors and learning administrators.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Button asChild size="sm" className="text-xs font-semibold gap-1.5" data-testid="go-to-learning-report-btn">
                            <Link to="/reports/learning">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>Go to My Learning Progress</span>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportAccessDenied;
