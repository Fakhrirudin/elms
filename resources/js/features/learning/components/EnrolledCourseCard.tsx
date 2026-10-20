import { Link, useNavigate } from 'react-router-dom';
import { Enrollment } from '../types';
import EnrollmentStatusBadge from './EnrollmentStatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, ArrowRight, Clock, Award, Layers, PlayCircle } from 'lucide-react';
import { Certificate } from '@/features/certificates/types';

interface EnrolledCourseCardProps {
    enrollment: Enrollment;
    certificate?: Certificate | null;
}

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({ enrollment, certificate: propCert }) => {
    const navigate = useNavigate();
    const course = enrollment.course;
    const cert = propCert || enrollment.certificate;

    const handleNavigate = (e: React.MouseEvent) => {
        e.preventDefault();
        if (enrollment?.id) {
            navigate(`/my-learning/${enrollment.id}`);
        }
    };

    const formattedEnrolledDate = enrollment.enrolled_at
        ? new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : null;

    // Progress details
    const percentage = enrollment.progress?.percentage ?? (enrollment.status === 'COMPLETED' ? 100 : 0);
    const totalModules = enrollment.progress?.total_modules ?? 0;
    const completedModules = enrollment.progress?.completed_modules ?? 0;
    const lastActivity = enrollment.progress?.last_activity;

    // Button label determination
    let ctaLabel = 'Continue Learning';
    if (enrollment.status === 'COMPLETED') {
        ctaLabel = 'Review Course';
    } else if (enrollment.status === 'ENROLLED' && percentage === 0) {
        ctaLabel = 'Start Course';
    }

    return (
        <Card className="flex flex-col h-full overflow-hidden border-border/80 hover:border-border transition-all duration-200 hover:shadow-sm" data-testid={`enrolled-course-card-${enrollment.id}`}>
            {/* Thumbnail / Header Media */}
            <div className="relative aspect-video w-full bg-muted/40 overflow-hidden border-b border-border/50">
                {course?.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                ) : (
                    <div
                        data-testid="enrolled-card-fallback-thumbnail"
                        className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5 p-4 text-muted-foreground"
                    >
                        <BookOpen className="h-10 w-10 text-primary/50 mb-1" />
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/70">
                            ELMS Learning
                        </span>
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                    {course?.category ? (
                        <Badge
                            variant="secondary"
                            className="bg-card/90 backdrop-blur-xs text-foreground font-medium text-[11px] shadow-xs truncate max-w-[150px]"
                        >
                            {course.category.name}
                        </Badge>
                    ) : (
                        <span />
                    )}

                    <EnrollmentStatusBadge status={enrollment.status} className="shadow-xs" />
                </div>
            </div>

            {/* Course Content Body */}
            <CardHeader className="p-4 sm:p-5 pb-2 flex-1 space-y-1.5">
                <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 leading-snug">
                    <Link
                        to={`/my-learning/${enrollment.id}`}
                        className="hover:text-primary transition-colors text-foreground"
                    >
                        {course?.title || 'Enrolled Course'}
                    </Link>
                </CardTitle>

                {course?.description && (
                    <CardDescription className="text-xs sm:text-sm line-clamp-2 text-muted-foreground">
                        {course.description}
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="px-4 sm:px-5 py-2 space-y-3">
                {/* Progress bar section */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground text-[11px]">Progress</span>
                        <span className="font-semibold text-primary text-[11px]" data-testid="course-progress-percent">
                            {percentage}%
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                            role="progressbar"
                            aria-valuenow={percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                </div>

                {/* Meta details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                        <span>
                            {totalModules > 0
                                ? `${completedModules} / ${totalModules} Modules`
                                : `${course?.estimated_duration || 1}h duration`}
                        </span>
                    </div>

                    {lastActivity && lastActivity.type && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium truncate max-w-[130px]">
                            <PlayCircle className="h-3 w-3 text-primary/70 shrink-0" />
                            <span className="capitalize truncate">
                                {lastActivity.type.toLowerCase()}
                            </span>
                        </div>
                    )}
                </div>

                {formattedEnrolledDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                        <span>Enrolled: {formattedEnrolledDate}</span>
                    </div>
                )}
            </CardContent>

            {/* Card Footer with CTA */}
            <CardFooter className="p-4 sm:p-5 pt-2 flex flex-col gap-2">
                <Button asChild className="w-full text-xs font-semibold gap-1.5" data-testid="course-cta-btn">
                    <Link to={`/my-learning/${enrollment.id}`} onClick={handleNavigate}>
                        <span>{ctaLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </Button>
                {cert && (
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                        data-testid="card-view-certificate-btn"
                    >
                        <Link to={`/certificates/${cert.id}`}>
                            <Award className="h-3.5 w-3.5" />
                            <span>View Certificate</span>
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default EnrolledCourseCard;
