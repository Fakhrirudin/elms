import React from 'react';
import { useParams, Link } from 'react-router-dom';
import useCertificateDetail from '../hooks/useCertificateDetail';
import CertificateDocument from '../components/CertificateDocument';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export const CertificateDetailPage: React.FC = () => {
    const { certificateId } = useParams<{ certificateId: string }>();

    const {
        data: certificate,
        isLoading,
        isError,
        error,
        refetch,
    } = useCertificateDetail(certificateId);

    // Loading State
    if (isLoading) {
        return (
            <div data-testid="certificate-detail-skeleton" className="space-y-6 max-w-4xl mx-auto animate-pulse">
                <div className="h-8 w-40 bg-muted/60 rounded-md" />
                <div className="h-[520px] w-full bg-muted/40 rounded-2xl border-4 border-muted/50 p-8 space-y-6">
                    <div className="h-10 w-48 bg-muted/60 rounded-md mx-auto" />
                    <div className="h-8 w-72 bg-muted/50 rounded-md mx-auto" />
                    <div className="h-12 w-64 bg-muted/70 rounded-md mx-auto mt-8" />
                    <div className="h-6 w-96 bg-muted/40 rounded-md mx-auto" />
                </div>
            </div>
        );
    }

    // Error Handling
    if (isError || !certificate) {
        const statusCode = error?.response?.status;

        if (statusCode === 403) {
            return (
                <div className="space-y-6 max-w-2xl mx-auto">
                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <Link to="/certificates">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Back to Certificates</span>
                        </Link>
                    </Button>

                    <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12" data-testid="certificate-403-error">
                        <CardContent className="space-y-4">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <ShieldAlert className="h-7 w-7" />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                    Access Denied
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    You do not have permission to view this certificate. ELMS certificates can only be accessed by the recipient, assigned instructors, or learning administrators.
                                </p>
                            </div>
                            <Button asChild size="sm" className="text-xs font-medium">
                                <Link to="/certificates">Go to My Certificates</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        if (statusCode === 404) {
            return (
                <div className="space-y-6 max-w-2xl mx-auto">
                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <Link to="/certificates">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Back to Certificates</span>
                        </Link>
                    </Button>

                    <Card className="border-border bg-card/60 text-center p-8 sm:p-12" data-testid="certificate-404-error">
                        <CardContent className="space-y-4">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <AlertCircle className="h-7 w-7" />
                            </div>
                            <div className="space-y-1 max-w-md mx-auto">
                                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                                    Certificate Not Found
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    The requested certificate could not be found or has been removed from the system.
                                </p>
                            </div>
                            <Button asChild size="sm" className="text-xs font-medium">
                                <Link to="/certificates">Return to Certificates</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Generic Network/Server Error
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Link to="/certificates">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Certificates</span>
                    </Link>
                </Button>

                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-7 w-7" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                Failed to Load Certificate
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {error?.message || 'An unexpected error occurred while loading the certificate.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="inline-flex items-center gap-1.5 text-xs font-medium"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Retry</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success State
    return (
        <div className="max-w-4xl mx-auto">
            <CertificateDocument certificate={certificate} />
        </div>
    );
};

export default CertificateDetailPage;

