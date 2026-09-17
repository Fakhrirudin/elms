import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useMyCourses from '@/features/learning/hooks/useMyCourses';
import useEnrollCourse from '@/features/learning/hooks/useEnrollCourse';
import { useCourseDetail } from '../hooks/useCourseDetail';
import { useCourseModules } from '../hooks/useCourseModules';
import ModuleAccordion from '../components/syllabus/ModuleAccordion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    ArrowRight,
    Clock,
    Layers,
    Calendar,
    Users,
    BookOpen,
    AlertCircle,
    RefreshCw,
    Sparkles,
    GraduationCap,
    Loader2,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';

    const [enrollError, setEnrollError] = useState<string | null>(null);

    const {
        data: course,
        isLoading: isLoadingCourse,
        isError: isErrorCourse,
        error: errorCourse,
        refetch: refetchCourse,
    } = useCourseDetail(id);

    const {
        data: modules = [],
        isLoading: isLoadingModules,
        isError: isErrorModules,
        error: errorModules,
        refetch: refetchModules,
    } = useCourseModules(id);

    // Fetch employee enrollments to detect if already enrolled in this course
    const { data: myCoursesData } = useMyCourses(
        { per_page: 100 },
        { enabled: isEmployee }
    );

    const existingEnrollment = course
        ? myCoursesData?.enrollments.find((e) => e.course_id === course.id)
        : undefined;

    const enrollMutation = useEnrollCourse();

    const handleEnroll = () => {
        if (!course) return;
        setEnrollError(null);
        enrollMutation.mutate(course.id, {
            onSuccess: (newEnrollment) => {
                navigate(`/my-learning/${newEnrollment.id}`);
            },
            onError: (err) => {
                setEnrollError(
                    err.response?.data?.message || 'Failed to enroll in this course.'
                );
            },
        });
    };

    // Format published date
    const formattedPublishedDate = course?.published_at
        ? new Date(course.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : null;

    // Loading State
    if (isLoadingCourse) {
        return (
            <div data-testid="course-detail-skeleton" className="space-y-6 animate-pulse">
                <div className="h-6 w-32 bg-muted/70 rounded-md" />
                <div className="h-56 w-full bg-muted/50 rounded-xl" />
                <div className="space-y-3 pt-4">
                    <div className="h-8 w-2/3 bg-muted/70 rounded-md" />
                    <div className="h-4 w-full bg-muted/40 rounded-md" />
                    <div className="h-4 w-5/6 bg-muted/40 rounded-md" />
                </div>
            </div>
        );
    }

    // Error State
    if (isErrorCourse || !course) {
        return (
            <div className="space-y-6">
                <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <Link to="/courses">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Catalog</span>
                    </Link>
                </Button>

                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                Course Not Found
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {errorCourse?.message ||
                                    'The requested course could not be loaded or may not be accessible with your permissions.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchCourse()}
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

    const instructorNames = course.instructors && course.instructors.length > 0
        ? course.instructors.map((i) => i.name).join(', ')
        : 'Instructor TBA';

    const totalMaterials = modules.reduce((acc, m) => acc + (m.materials?.length || 0), 0);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Top Navigation */}
            <div>
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
                >
                    <Link to="/courses">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Catalog</span>
                    </Link>
                </Button>
            </div>

            {/* Course Header Banner */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                    {/* Course Thumbnail or Fallback */}
                    <div className="md:col-span-5 relative aspect-video md:aspect-auto min-h-[220px] bg-muted/40">
                        {course.thumbnail ? (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div
                                data-testid="course-detail-fallback-thumbnail"
                                className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5 p-6 text-muted-foreground"
                            >
                                <BookOpen className="h-12 w-12 text-primary/50 mb-2" />
                                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/70">
                                    ELMS Course Curriculum
                                </span>
                            </div>
                        )}

                        {course.category && (
                            <div className="absolute top-3 left-3">
                                <Badge
                                    variant="secondary"
                                    className="bg-card/90 backdrop-blur-xs text-foreground font-medium text-xs shadow-xs"
                                >
                                    {course.category.name}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Course Info */}
                    <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                                {course.status !== 'PUBLISHED' && (
                                    <Badge
                                        variant={course.status === 'DRAFT' ? 'outline' : 'destructive'}
                                        className="text-[11px] font-semibold tracking-wider uppercase"
                                    >
                                        {course.status}
                                    </Badge>
                                )}
                            </div>

                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                                {course.title}
                            </h1>

                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {course.description || 'No detailed description provided for this course.'}
                            </p>
                        </div>

                        {/* Metadata Pills */}
                        <div className="pt-4 border-t border-border/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <span className="text-[10px] uppercase text-muted-foreground/80 block font-mono">
                                        Duration
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {course.estimated_duration
                                            ? `${course.estimated_duration} ${course.estimated_duration === 1 ? 'hour' : 'hours'}`
                                            : 'Self-paced'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Layers className="h-4 w-4 text-primary shrink-0" />
                                <div>
                                    <span className="text-[10px] uppercase text-muted-foreground/80 block font-mono">
                                        Structure
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
                                    </span>
                                </div>
                            </div>

                            {formattedPublishedDate && (
                                <div className="flex items-center gap-2 text-muted-foreground col-span-2 sm:col-span-1">
                                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                                    <div>
                                        <span className="text-[10px] uppercase text-muted-foreground/80 block font-mono">
                                            Published
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            {formattedPublishedDate}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instructors Row */}
                        <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>
                                Led by <span className="font-medium text-foreground">{instructorNames}</span>
                            </span>
                        </div>

                        {/* Enrollment CTA Section */}
                        <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {isEmployee ? (
                                existingEnrollment ? (
                                    <div className="flex items-center gap-3">
                                        <Button asChild size="sm" className="text-xs font-semibold gap-1.5">
                                            <Link to={`/my-learning/${existingEnrollment.id}`}>
                                                <span>Continue Learning</span>
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            Enrolled in course
                                        </span>
                                    </div>
                                ) : course.status === 'PUBLISHED' ? (
                                    <div className="space-y-1.5 w-full sm:w-auto">
                                        <Button
                                            size="sm"
                                            disabled={enrollMutation.isPending}
                                            onClick={handleEnroll}
                                            className="text-xs font-semibold gap-1.5 w-full sm:w-auto"
                                        >
                                            {enrollMutation.isPending ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    <span>Enrolling...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <GraduationCap className="h-4 w-4" />
                                                    <span>Enroll in Course</span>
                                                </>
                                            )}
                                        </Button>
                                        {enrollError && (
                                            <p className="text-xs text-destructive">{enrollError}</p>
                                        )}
                                    </div>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-muted-foreground w-fit">
                                        Enrollment Unavailable ({course.status})
                                    </Badge>
                                )
                            ) : (
                                <span className="text-xs text-muted-foreground italic">
                                    Course enrollment is available for employee learners.
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Syllabus Section */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                        Course Syllabus & Curriculum
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Review the learning modules, instructional materials, and completion requirements.
                    </p>
                </div>

                {isLoadingModules ? (
                    <div className="p-8 text-center rounded-xl border border-border bg-card/40 space-y-2 animate-pulse">
                        <div className="h-5 w-48 bg-muted/60 rounded-md mx-auto" />
                        <div className="h-4 w-64 bg-muted/40 rounded-md mx-auto" />
                    </div>
                ) : isErrorModules ? (
                    <Card className="border-destructive/30 bg-destructive/5 text-center p-6">
                        <CardContent className="space-y-3">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {errorModules?.message || 'Failed to load module syllabus for this course.'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetchModules()}
                                className="text-xs"
                            >
                                <RefreshCw className="h-3 w-3 mr-1" /> Retry Syllabus
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <ModuleAccordion modules={modules} />
                )}
            </div>
        </div>
    );
};

export default CourseDetailPage;

