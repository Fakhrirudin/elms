import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ArrowRight, BookOpen } from 'lucide-react';

export const CertificateEmptyState: React.FC = () => {
    return (
        <Card className="border-dashed border-2 border-border bg-card/40 p-8 sm:p-12 text-center" data-testid="certificate-empty-state">
            <CardContent className="space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Award className="h-7 w-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        No Certificates Earned Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Complete all mandatory curriculum materials and required evaluations in your enrolled training programs to earn and view verified ELMS certificates.
                    </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <Button asChild size="sm" className="text-xs font-semibold gap-1.5">
                        <Link to="/my-learning">
                            <span>Go to My Learning</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="text-xs font-medium gap-1.5">
                        <Link to="/courses">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Browse Courses</span>
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default CertificateEmptyState;

