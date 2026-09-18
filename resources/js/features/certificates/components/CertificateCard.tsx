import React from 'react';
import { Link } from 'react-router-dom';
import { Certificate } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Calendar, User, ArrowRight } from 'lucide-react';

interface CertificateCardProps {
    certificate: Certificate;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
    const formattedDate = certificate.issued_at
        ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : null;

    return (
        <Card className="flex flex-col h-full border-border/80 hover:border-border transition-all duration-200 hover:shadow-xs overflow-hidden">
            {/* Header with Award icon and Certificate Number Badge */}
            <div className="p-4 sm:p-5 pb-0 flex items-start justify-between gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="font-mono text-[11px] font-semibold tracking-wide">
                    {certificate.certificate_number}
                </Badge>
            </div>

            <CardHeader className="p-4 sm:p-5 pt-3 flex-1 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                    Certificate of Completion
                </span>
                <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 text-foreground leading-snug">
                    <Link
                        to={`/certificates/${certificate.id}`}
                        className="hover:text-primary transition-colors"
                    >
                        {certificate.course.title}
                    </Link>
                </CardTitle>
            </CardHeader>

            <CardContent className="px-4 sm:px-5 py-2 space-y-2 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                    <span className="truncate">Awarded to <span className="font-medium text-foreground">{certificate.employee.name}</span></span>
                </div>

                {formattedDate && (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                        <span>Issued on {formattedDate}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-4 sm:p-5 pt-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5">
                    <Link to={`/certificates/${certificate.id}`}>
                        <span>View Certificate</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default CertificateCard;

