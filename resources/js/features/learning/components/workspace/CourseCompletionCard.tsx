import React from 'react';
import { Link } from 'react-router-dom';
import { LearningOverview } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Award,
    CheckCircle2,
    Sparkles,
    RefreshCw,
    AlertCircle,
    Calendar,
    ArrowRight,
} from 'lucide-react';
import useIssueCertificate from '@/features/certificates/hooks/useIssueCertificate';

interface CourseCompletionCardProps {
    overview: LearningOverview;
}

export const CourseCompletionCard: React.FC<CourseCompletionCardProps> = ({ overview }) => {
    const issueCertificateMutation = useIssueCertificate();
    const [issuedCert, setIssuedCert] = React.useState<any>(null);

    const certData = overview.certificate as any;
    const cert = issuedCert || (certData?.certificate?.id
        ? certData.certificate
        : certData?.id
            ? certData
            : null);
    const completedDate = overview.completed_at
        ? new Date(overview.completed_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : 'Recently';

    const handleRequestCertificate = () => {
        issueCertificateMutation.mutate(overview.enrollment_id, {
            onSuccess: (data) => {
                setIssuedCert(data);
            },
        });
    };

    return (
        <Card
            className="border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-primary/5 shadow-sm overflow-hidden"
            data-testid="course-completion-card"
        >
            <CardHeader className="p-6 pb-4 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                                    Milestone Reached
                                </span>
                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] py-0 h-4">
                                    Completed
                                </Badge>
                            </div>
                            <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                                Course Completed!
                            </CardTitle>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Completed on: {completedDate}</span>
                    </div>
                </div>

                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed">
                    Congratulations! You have successfully fulfilled all course requirements, completed all mandatory learning materials, passed required quizzes, and passed all course assignments.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
                {/* Certificate Section */}
                {cert ? (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" data-testid="completion-cert-issued">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Certificate of Completion Issued
                                </h4>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                                Credential ID: {cert.certificate_number}
                            </p>
                        </div>

                        <Button asChild size="sm" className="gap-1.5 text-xs font-semibold shrink-0 w-full sm:w-auto" data-testid="completion-view-cert-cta">
                            <Link to={`/certificates/${cert.id}`}>
                                <Award className="h-3.5 w-3.5" />
                                <span>View Certificate</span>
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3" data-testid="completion-cert-ready">
                        {issueCertificateMutation.isError && (
                            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1" data-testid="completion-cert-error">
                                <div className="font-semibold flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>Cannot Issue Certificate</span>
                                </div>
                                <p>
                                    {issueCertificateMutation.error?.response?.data?.message ||
                                        issueCertificateMutation.error?.message ||
                                        'All course requirements must be verified before issuing a certificate.'}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Award className="h-4 w-4 text-primary" />
                                    <span>Certificate of Completion</span>
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Your completion has been recorded. Generate your Certificate of Completion now.
                                </p>
                            </div>

                            <Button
                                size="sm"
                                onClick={handleRequestCertificate}
                                disabled={issueCertificateMutation.isPending}
                                className="gap-1.5 text-xs font-semibold shrink-0 w-full sm:w-auto"
                                data-testid="completion-request-cert-btn"
                            >
                                {issueCertificateMutation.isPending ? (
                                    <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        <span>Issuing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Award className="h-3.5 w-3.5" />
                                        <span>Request Certificate</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CourseCompletionCard;
