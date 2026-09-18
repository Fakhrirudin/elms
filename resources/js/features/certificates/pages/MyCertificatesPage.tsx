import React, { useState } from 'react';
import useMyCertificates from '../hooks/useMyCertificates';
import CertificateCard from '../components/CertificateCard';
import CertificateEmptyState from '../components/CertificateEmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Award,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

export const MyCertificatesPage: React.FC = () => {
    const [page, setPage] = useState<number>(1);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useMyCertificates(page);

    const certificates = data?.certificates || [];
    const meta = data?.meta;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                    <Award className="h-6 w-6" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/90">
                        Employee Credentials
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    My Certificates
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                    View, download, and print your verified ELMS Certificates of Completion earned from completed training courses.
                </p>
            </div>

            {/* Content Area */}
            {isLoading ? (
                /* Loading Skeleton */
                <div data-testid="certificates-loading-skeleton" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-64 rounded-xl border border-border bg-card/40 p-5 space-y-4 animate-pulse"
                            >
                                <div className="h-10 w-10 rounded-lg bg-muted/60" />
                                <div className="h-5 w-3/4 rounded-md bg-muted/60" />
                                <div className="h-4 w-1/2 rounded-md bg-muted/40" />
                                <div className="h-8 w-full rounded-md bg-muted/40 mt-6" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : isError ? (
                /* Error State */
                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                Failed to Load Certificates
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {error?.message ||
                                    'An unexpected error occurred while fetching your certificates.'}
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
            ) : certificates.length === 0 ? (
                /* Empty State */
                <CertificateEmptyState />
            ) : (
                /* Certificates Grid */
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => (
                            <CertificateCard key={cert.id} certificate={cert} />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {meta && meta.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                Showing page <span className="font-semibold text-foreground">{meta.current_page}</span> of{' '}
                                <span className="font-semibold text-foreground">{meta.last_page}</span> ({meta.total} total certificates)
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.current_page <= 1 || isFetching}
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    className="h-8 px-3 text-xs gap-1"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    <span>Previous</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.current_page >= meta.last_page || isFetching}
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="h-8 px-3 text-xs gap-1"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyCertificatesPage;

