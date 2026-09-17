import React from 'react';
import { Link } from 'react-router-dom';
import { Enrollment } from '../types';
import EnrollmentStatusBadge from './EnrollmentStatusBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, ArrowRight, Clock } from 'lucide-react';

interface EnrolledCourseCardProps {
    enrollment: Enrollment;
}

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({ enrollment }) => {
    const course = enrollment.course;

    const formattedEnrolledDate = enrollment.enrolled_at
        ? new Date(enrollment.enrolled_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : null;

    return (
        <Card className="flex flex-col h-full overflow-hidden border-border/80 hover:border-border transition-all duration-200 hover:shadow-sm">
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

            <CardContent className="px-4 sm:px-5 py-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    {formattedEnrolledDate && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                            <span>Enrolled: {formattedEnrolledDate}</span>
                        </div>
                    )}

                    {course?.estimated_duration && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                            <span>{course.estimated_duration}h</span>
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Card Footer with CTA */}
            <CardFooter className="p-4 sm:p-5 pt-2">
                <Button asChild className="w-full text-xs font-semibold gap-1.5">
                    <Link to={`/my-learning/${enrollment.id}`}>
                        <span>{enrollment.status === 'COMPLETED' ? 'Review Course' : 'Continue Learning'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default EnrolledCourseCard;

