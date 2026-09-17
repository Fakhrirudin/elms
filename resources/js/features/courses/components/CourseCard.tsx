import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Users, ArrowRight } from 'lucide-react';

interface CourseCardProps {
    course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    const instructorNames = course.instructors && course.instructors.length > 0
        ? course.instructors.map((i) => i.name).join(', ')
        : 'Instructor TBA';

    return (
        <Card className="flex flex-col h-full overflow-hidden border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 group">
            {/* Thumbnail Header */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted/40">
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div
                        data-testid="course-card-fallback-thumbnail"
                        className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5 p-4 text-muted-foreground"
                    >
                        <BookOpen className="h-10 w-10 text-primary/50 mb-1.5" />
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70">
                            ELMS Course
                        </span>
                    </div>
                )}

                {/* Category Badge overlay on thumbnail */}
                {course.category && (
                    <div className="absolute top-2.5 left-2.5">
                        <Badge
                            variant="secondary"
                            className="bg-card/90 backdrop-blur-xs text-foreground font-medium text-[11px] shadow-xs"
                        >
                            {course.category.name}
                        </Badge>
                    </div>
                )}

                {/* Non-published Status Badge for Instructors/Admins */}
                {course.status !== 'PUBLISHED' && (
                    <div className="absolute top-2.5 right-2.5">
                        <Badge
                            variant={course.status === 'DRAFT' ? 'outline' : 'destructive'}
                            className="bg-card/90 backdrop-blur-xs font-semibold text-[10px] tracking-wide uppercase shadow-xs"
                        >
                            {course.status}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <CardContent className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                    <Link
                        to={`/courses/${course.id}`}
                        className="block focus:outline-hidden"
                    >
                        <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                        </h3>
                    </Link>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {course.description || 'No description available for this course yet.'}
                    </p>
                </div>

                {/* Metadata row: Duration and Instructors */}
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                        <span>
                            {course.estimated_duration
                                ? `${course.estimated_duration} ${course.estimated_duration === 1 ? 'hr' : 'hrs'}`
                                : 'Self-paced'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 max-w-[160px] truncate" title={instructorNames}>
                        <Users className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                        <span className="truncate">{instructorNames}</span>
                    </div>
                </div>
            </CardContent>

            {/* Card Footer: Navigation to Syllabus */}
            <CardFooter className="p-4 sm:p-5 pt-0">
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-medium justify-between group-hover:border-primary/50 group-hover:bg-primary/5"
                >
                    <Link to={`/courses/${course.id}`}>
                        <span>View Syllabus</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default CourseCard;

