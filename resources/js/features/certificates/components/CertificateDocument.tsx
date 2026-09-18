import React from 'react';
import { Link } from 'react-router-dom';
import { Certificate } from '../types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Award, CheckCircle2 } from 'lucide-react';

interface CertificateDocumentProps {
    certificate: Certificate;
    onBack?: () => void;
}

export const CertificateDocument: React.FC<CertificateDocumentProps> = ({ certificate }) => {
    const formattedDate = certificate.issued_at
        ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : 'Official Record';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Action Bar (Hidden on Print) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
                >
                    <Link to="/certificates">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Certificates</span>
                    </Link>
                </Button>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handlePrint}
                        size="sm"
                        className="gap-1.5 text-xs font-semibold shadow-xs"
                        data-testid="print-certificate-btn"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print / Save PDF</span>
                    </Button>
                </div>
            </div>

            {/* Certificate Document Container */}
            <div
                data-testid="certificate-document-container"
                className="relative bg-card text-card-foreground border-8 border-double border-primary/20 dark:border-primary/30 rounded-2xl p-6 sm:p-12 lg:p-16 shadow-lg max-w-4xl mx-auto overflow-hidden print:border-4 print:border-gray-700 print:shadow-none print:p-8 print:m-0 print:rounded-none"
            >
                {/* Subtle Background Badge / Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                    <Award className="h-96 w-96 text-primary" />
                </div>

                {/* Inner Border Frame */}
                <div className="relative border border-primary/30 dark:border-primary/40 rounded-xl p-6 sm:p-10 text-center space-y-8 print:border-gray-400 print:p-6 print:space-y-6">
                    {/* Header Branding */}
                    <div className="space-y-2">
                        <div className="inline-flex items-center justify-center gap-2 text-primary">
                            <span className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs print:border print:border-gray-800">
                                E
                            </span>
                            <span className="font-bold tracking-widest text-xs uppercase text-foreground/80">
                                Employee Learning Management System
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-foreground pt-2">
                            Certificate of Completion
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-widest font-sans font-medium">
                            ELMS Professional Development Record
                        </p>
                    </div>

                    {/* Divider Accent */}
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-16 sm:w-24 bg-primary/40" />
                        <Award className="h-5 w-5 text-primary shrink-0" />
                        <div className="h-px w-16 sm:w-24 bg-primary/40" />
                    </div>

                    {/* Recipient Presentation */}
                    <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-muted-foreground italic font-serif">
                            This is to certify that
                        </p>
                        <h2 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">
                            {certificate.employee.name}
                        </h2>
                        {certificate.employee.nip && (
                            <p className="text-xs font-mono text-muted-foreground pt-1">
                                Employee ID / NIP: {certificate.employee.nip}
                            </p>
                        )}
                    </div>

                    {/* Course Narrative */}
                    <div className="max-w-xl mx-auto space-y-2 pt-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            has successfully fulfilled all curriculum requirements and passed all required assessments for the course
                        </p>
                        <h3 className="text-lg sm:text-2xl font-bold text-primary tracking-tight">
                            {certificate.course.title}
                        </h3>
                    </div>

                    {/* Footer / Authority Verification Metadata */}
                    <div className="pt-8 border-t border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-left print:pt-6">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                Certificate Identifier
                            </span>
                            <p className="font-mono text-xs sm:text-sm font-semibold text-foreground">
                                {certificate.certificate_number}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono block pt-2">
                                Date of Issuance
                            </span>
                            <p className="text-xs text-foreground font-medium">
                                {formattedDate}
                            </p>
                        </div>

                        <div className="sm:text-right space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span>Verified ELMS Record</span>
                            </div>
                            <p className="text-xs font-medium text-foreground">
                                Internal Training & Competency Simulation
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                Authentic electronic completion record
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateDocument;

