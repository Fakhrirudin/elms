import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import useEnrollment from '../hooks/useEnrollment';
import useLearningProgress from '../hooks/useLearningProgress';
import useCompleteMaterial from '../hooks/useCompleteMaterial';
import useLearningOverview from '../hooks/useLearningOverview';
import useUpdateActivity from '../hooks/useUpdateActivity';
import useCourseModules from '@/features/courses/hooks/useCourseModules';
import useMyCertificates from '@/features/certificates/hooks/useMyCertificates';
import useIssueCertificate from '@/features/certificates/hooks/useIssueCertificate';
import { Material } from '@/features/courses/types';
import { ActivityType, ModuleOutlineActivity } from '../types';
import EnrollmentStatusBadge from '../components/EnrollmentStatusBadge';
import MaterialListItem from '../components/player/MaterialListItem';
import MaterialContentViewer from '../components/player/MaterialContentViewer';
import CourseOutline from '../components/workspace/CourseOutline';
import CourseCompletionCard from '../components/workspace/CourseCompletionCard';
import QuizLauncherCard from '../components/workspace/QuizLauncherCard';
import AssignmentLauncherCard from '../components/workspace/AssignmentLauncherCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Clock,
    BookOpen,
    AlertCircle,
    RefreshCw,
    CheckCircle2,
    Layers,
    Users,
    Award,
    ClipboardList,
    PlayCircle,
} from 'lucide-react';

export const LearningPlayerPage: React.FC = () => {
    const { enrollmentId } = useParams<{ enrollmentId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const explicitQuizId = searchParams.get('quiz_id');
    const explicitMaterialId = searchParams.get('material_id');
    const explicitAssignmentId = searchParams.get('assignment_id');

    // 1. Authoritative Enrollment Resource
    const {
        data: enrollment,
        isLoading: isLoadingEnrollment,
        isError: isErrorEnrollment,
        error: errorEnrollment,
        refetch: refetchEnrollment,
    } = useEnrollment(enrollmentId);

    // 2. Authoritative Syllabus Hierarchy
    const {
        data: modules = [],
        isLoading: isLoadingModules,
    } = useCourseModules(enrollment?.course_id);

    // 3. Authoritative Progress Metrics
    const {
        data: progress,
        isLoading: isLoadingProgress,
        refetch: refetchProgress,
    } = useLearningProgress(enrollmentId);

    // 4. Authoritative Full Learning Overview (Modules with quizzes, assignments, statuses)
    const {
        data: overview,
        isLoading: isLoadingOverview,
        refetch: refetchOverview,
    } = useLearningOverview(enrollmentId);

    // 5. Activity update mutation
    const updateActivityMutation = useUpdateActivity(enrollmentId);

    // 6. Material Completion Mutation
    const completeMaterialMutation = useCompleteMaterial();

    // 7. Authoritative Certificate Data & Issuance Mutation
    const { data: certificatesData } = useMyCertificates();
    const issueCertificateMutation = useIssueCertificate();

    const certObj = overview?.certificate;
    const existingCertificate =
        (certObj && 'certificate' in certObj && certObj.certificate ? certObj.certificate : null) ||
        (certObj && 'certificate_number' in certObj && certObj.certificate_number ? (certObj as any) : null) ||
        certificatesData?.certificates?.find((c) => c.enrollment_id === Number(enrollmentId)) ||
        null;

    const handleRequestCertificate = () => {
        if (!enrollmentId) return;
        issueCertificateMutation.mutate(enrollmentId);
    };

    // 8. Active Selection State
    const [selectedActivity, setSelectedActivity] = useState<{
        type: ActivityType;
        id: number;
    } | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [completedMaterialIds, setCompletedMaterialIds] = useState<Set<number>>(new Set());

    // Sync completed material IDs from overview modules
    useEffect(() => {
        if (overview?.modules) {
            const completed = new Set<number>();
            overview.modules.forEach((mod) => {
                mod.activities.forEach((act) => {
                    if (act.type === 'MATERIAL' && (act.status === 'COMPLETED' || act.completed_at)) {
                        completed.add(Number(act.id));
                    }
                });
            });
            setCompletedMaterialIds((prev) => {
                const next = new Set(prev);
                completed.forEach((id) => next.add(id));
                return next;
            });
        }
    }, [overview]);

    // Sync selected activity based on query params or overview current_activity
    useEffect(() => {
        if (explicitQuizId) {
            setSelectedActivity({ type: 'QUIZ', id: Number(explicitQuizId) });
        } else if (explicitAssignmentId) {
            setSelectedActivity({ type: 'ASSIGNMENT', id: Number(explicitAssignmentId) });
        } else if (explicitMaterialId) {
            setSelectedActivity({ type: 'MATERIAL', id: Number(explicitMaterialId) });
            // Find material in modules or fallback to overview
            let found = false;
            for (const mod of modules) {
                const mat = mod.materials?.find((m) => m.id === Number(explicitMaterialId));
                if (mat) {
                    setSelectedMaterial(mat);
                    found = true;
                    break;
                }
            }
            if (!found && overview?.modules) {
                for (const mod of overview.modules) {
                    const act = mod.activities.find((a) => a.type === 'MATERIAL' && Number(a.id) === Number(explicitMaterialId));
                    if (act) {
                        setSelectedMaterial({
                            id: act.id,
                            module_id: act.module_id,
                            title: act.title,
                            type: act.material_type || 'TEXT',
                            content: act.content || null,
                            file_path: act.file_path || null,
                            video_url: act.video_url || null,
                            sort_order: act.sort_order,
                            is_mandatory: act.is_required,
                        });
                        break;
                    }
                }
            }
        } else if (overview?.current_activity && !selectedActivity) {
            setSelectedActivity({
                type: overview.current_activity.type,
                id: Number(overview.current_activity.id),
            });
            if (overview.current_activity.type === 'MATERIAL') {
                let found = false;
                for (const mod of modules) {
                    const mat = mod.materials?.find((m) => m.id === Number(overview.current_activity?.id));
                    if (mat) {
                        setSelectedMaterial(mat);
                        found = true;
                        break;
                    }
                }
                if (!found && overview.modules) {
                    for (const mod of overview.modules) {
                        const act = mod.activities.find((a) => a.type === 'MATERIAL' && Number(a.id) === Number(overview.current_activity?.id));
                        if (act) {
                            setSelectedMaterial({
                                id: act.id,
                                module_id: act.module_id,
                                title: act.title,
                                type: act.material_type || 'TEXT',
                                content: act.content || null,
                                file_path: act.file_path || null,
                                video_url: act.video_url || null,
                                sort_order: act.sort_order,
                                is_mandatory: act.is_required,
                            });
                            break;
                        }
                    }
                }
            }
        }
    }, [explicitQuizId, explicitAssignmentId, explicitMaterialId, overview?.current_activity, modules]);

    const handleSelectOutlineActivity = (activity: ModuleOutlineActivity) => {
        setSelectedActivity({ type: activity.type, id: activity.id });

        if (activity.type === 'MATERIAL') {
            // Find material object from modules
            let foundMat: Material | null = null;
            for (const mod of modules) {
                const mat = mod.materials?.find((m) => m.id === activity.id);
                if (mat) {
                    foundMat = mat;
                    break;
                }
            }
            if (!foundMat) {
                foundMat = {
                    id: activity.id,
                    module_id: activity.module_id,
                    title: activity.title,
                    type: activity.material_type || 'TEXT',
                    content: activity.content || null,
                    file_path: activity.file_path || null,
                    video_url: activity.video_url || null,
                    sort_order: activity.sort_order,
                    is_mandatory: activity.is_required,
                };
            }
            setSelectedMaterial(foundMat);
            setSearchParams({ material_id: String(activity.id) });
        } else if (activity.type === 'QUIZ') {
            setSelectedMaterial(null);
            setSearchParams({ quiz_id: String(activity.id) });
        } else if (activity.type === 'ASSIGNMENT') {
            setSelectedMaterial(null);
            setSearchParams({ assignment_id: String(activity.id) });
        }

        // Persist last activity to server
        if (enrollmentId) {
            updateActivityMutation.mutate({
                activity_type: activity.type,
                activity_id: activity.id,
            });
        }
    };

    const handleMarkComplete = (materialId: number) => {
        if (!enrollmentId) return;

        completeMaterialMutation.mutate(
            { enrollmentId, materialId },
            {
                onSuccess: (result) => {
                    setCompletedMaterialIds((prev) => new Set([...prev, result.material_id]));
                    refetchOverview();
                    refetchProgress();
                    refetchEnrollment();
                },
            }
        );
    };

    const handleContinueLearning = () => {
        if (!overview?.current_activity) return;
        const curr = overview.current_activity;
        // Find activity in overview modules
        for (const mod of overview.modules) {
            const act = mod.activities.find((a) => a.type === curr.type && Number(a.id) === Number(curr.id));
            if (act) {
                handleSelectOutlineActivity(act);
                return;
            }
        }
    };

    // Helper: Determine if a material is completed
    const isMaterialCompleted = (material: Material): boolean => {
        if (completedMaterialIds.has(material.id)) {
            return true;
        }
        if (overview?.modules) {
            for (const mod of overview.modules) {
                const act = mod.activities.find(
                    (a) => a.type === 'MATERIAL' && Number(a.id) === Number(material.id)
                );
                if (act && (act.status === 'COMPLETED' || act.completed_at)) {
                    return true;
                }
            }
        }
        if ((progress?.status === 'COMPLETED' || overview?.status === 'COMPLETED') && material.is_mandatory) {
            return true;
        }
        return false;
    };

    // Loading State
    if (isLoadingEnrollment) {
        return (
            <div data-testid="learning-player-skeleton" className="space-y-6 animate-pulse">
                <div className="h-6 w-32 bg-muted/60 rounded-md" />
                <div className="h-44 w-full bg-muted/50 rounded-xl" />
                <div className="h-28 w-full bg-muted/40 rounded-xl" />
                <div className="space-y-3">
                    <div className="h-8 w-1/3 bg-muted/60 rounded-md" />
                    <div className="h-20 w-full bg-muted/30 rounded-lg" />
                    <div className="h-20 w-full bg-muted/30 rounded-lg" />
                </div>
            </div>
        );
    }

    // Error State
    if (isErrorEnrollment || !enrollment) {
        return (
            <div className="space-y-6">
                <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <Link to="/my-learning">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to My Learning</span>
                    </Link>
                </Button>

                <Card className="border-destructive/30 bg-destructive/5 text-center p-8 sm:p-12">
                    <CardContent className="space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-semibold text-foreground">
                                Enrollment Not Found
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {errorEnrollment?.message ||
                                    'The requested course enrollment could not be found or you do not have permission to view it.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetchEnrollment()}
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

    const course = enrollment.course;
    const progressPercentage =
        overview?.overall_percentage ??
        (overview as any)?.progress?.overall_percentage ??
        progress?.progress ??
        0;
    const totalMandatory =
        overview?.total_required_activities ??
        (overview as any)?.progress?.total_required_activities ??
        progress?.total_mandatory_materials ??
        0;
    const completedMandatory =
        overview?.completed_required_activities ??
        (overview as any)?.progress?.completed_required_activities ??
        progress?.completed_mandatory_materials ??
        0;
    const currentStatus = overview?.status ?? progress?.status ?? enrollment.status;
    const isCompleted =
        currentStatus === 'COMPLETED' ||
        overview?.is_course_completed ||
        Boolean((overview as any)?.progress?.is_completed);

    const instructorNames = course?.instructors && course.instructors.length > 0
        ? course.instructors.map((i) => i.name).join(', ')
        : 'Assigned Instructors';

    // Find currently selected outline activity from overview if available
    let activeOutlineActivity: ModuleOutlineActivity | null = null;
    if (overview && selectedActivity) {
        for (const mod of overview.modules) {
            const found = mod.activities.find(
                (a) => a.type === selectedActivity.type && Number(a.id) === Number(selectedActivity.id)
            );
            if (found) {
                activeOutlineActivity = found;
                break;
            }
        }
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Navigation Header */}
            <div>
                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
                >
                    <Link to="/my-learning">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to My Learning</span>
                    </Link>
                </Button>
            </div>

            {/* Course Hero Banner */}
            <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="p-6 sm:p-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {course?.category && (
                                <Badge variant="secondary" className="text-xs font-medium">
                                    {course.category.name}
                                </Badge>
                            )}
                            <EnrollmentStatusBadge status={currentStatus} />
                        </div>

                        {course?.estimated_duration && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                                <span>{course.estimated_duration} hours total</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                            {course?.title || 'Learning Course'}
                        </h1>
                        {course?.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {course.description}
                            </p>
                        )}
                    </div>

                    {/* Meta bar */}
                    <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>Led by <span className="font-medium text-foreground">{instructorNames}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{modules.length} Modules in Curriculum</span>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Authoritative Progress Card */}
            <Card className="border-border bg-card shadow-xs">
                <CardHeader className="p-5 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-semibold">Course Learning Progress</CardTitle>
                            <CardDescription className="text-xs">
                                Authoritative progress calculated from mandatory material completion
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isCompleted && overview?.current_activity && (
                                <Button
                                    size="sm"
                                    onClick={handleContinueLearning}
                                    className="text-xs font-semibold gap-1.5 shrink-0"
                                    data-testid="continue-learning-btn"
                                >
                                    <PlayCircle className="h-3.5 w-3.5" />
                                    <span>Continue Learning</span>
                                </Button>
                            )}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                <span>{progressPercentage}% Completed</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                    {/* Progress Bar */}
                    <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                            role="progressbar"
                            aria-valuenow={progressPercentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Mandatory Materials</span>
                        <span className="font-semibold text-foreground">
                            {completedMandatory} / {totalMandatory} finished
                        </span>
                    </div>

                    {currentStatus === 'COMPLETED' && (
                        <div className="mt-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                                Congratulations! You have completed all mandatory materials for this course.
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Certificate Section per approved 3-tier strategy */}
            {existingCertificate ? (
                <Card className="border-border bg-card shadow-xs overflow-hidden" data-testid="certificate-earned-card">
                    <CardHeader className="p-4 sm:p-5 pb-3 bg-primary/5 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                    Credential
                                </span>
                                <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                                    <Award className="h-4 w-4 text-primary" />
                                    <span>ELMS Certificate Earned</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Your verified Certificate of Completion has been issued for this course.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="font-mono text-[10px] font-semibold">
                                {existingCertificate.certificate_number}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground">
                            Issued on {existingCertificate.issued_at ? new Date(existingCertificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Completion Record'}.
                        </div>
                        <Button
                            asChild
                            size="sm"
                            className="gap-1.5 text-xs font-semibold shrink-0 w-full sm:w-auto"
                            data-testid="view-certificate-cta"
                        >
                            <Link to={`/certificates/${existingCertificate.id}`}>
                                <Award className="h-3.5 w-3.5" />
                                <span>View Certificate</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : currentStatus === 'COMPLETED' ? (
                <Card className="border-border bg-card shadow-xs overflow-hidden" data-testid="request-certificate-card">
                    <CardHeader className="p-4 sm:p-5 pb-3 bg-primary/5 border-b border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                    Course Completion
                                </span>
                                <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                                    <Award className="h-4 w-4 text-primary" />
                                    <span>Certificate Available</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Course requirements completed. You may now request your ELMS Certificate of Completion.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-semibold">
                                Ready
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-4">
                        {issueCertificateMutation.isError && (
                            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1" data-testid="request-certificate-error">
                                <div className="font-semibold flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>Cannot Issue Certificate</span>
                                </div>
                                <p>
                                    {issueCertificateMutation.error?.response?.data?.message ||
                                        issueCertificateMutation.error?.message ||
                                        'All mandatory materials and published quizzes must be completed before issuing a certificate.'}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground">
                                Request your electronic certificate. The backend will verify all completion criteria.
                            </div>
                            <Button
                                size="sm"
                                onClick={handleRequestCertificate}
                                disabled={issueCertificateMutation.isPending}
                                className="gap-1.5 text-xs font-semibold shrink-0 w-full sm:w-auto"
                                data-testid="request-certificate-btn"
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
                    </CardContent>
                </Card>
            ) : null}

            {/* Course Workspace: Two-Column Layout (Outline on Left, Player/Viewer on Right) */}
            {overview && overview.modules && overview.modules.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-testid="learning-workspace-layout">
                    {/* Left Column: Interactive Course Outline */}
                    <div className="lg:col-span-4 space-y-4">
                        <CourseOutline
                            modules={overview.modules}
                            selectedActivity={selectedActivity}
                            onSelectActivity={handleSelectOutlineActivity}
                        />
                    </div>

                    {/* Right Column: Activity Viewer / Player */}
                    <div className="lg:col-span-8 space-y-6">
                        {isCompleted && <CourseCompletionCard overview={overview} />}

                        {selectedActivity?.type === 'MATERIAL' && selectedMaterial && (
                            <div className="space-y-2">
                                <h2 className="text-base font-bold text-foreground">Material Reader</h2>
                                <MaterialContentViewer
                                    material={selectedMaterial}
                                    enrollmentId={enrollment.id}
                                    isCompleted={isMaterialCompleted(selectedMaterial)}
                                    isCompleting={completeMaterialMutation.isPending}
                                    onClose={() => setSelectedMaterial(null)}
                                    onMarkComplete={handleMarkComplete}
                                />
                            </div>
                        )}

                        {selectedActivity?.type === 'QUIZ' && activeOutlineActivity && (
                            <QuizLauncherCard
                                enrollmentId={enrollment.id}
                                activity={activeOutlineActivity}
                            />
                        )}

                        {selectedActivity?.type === 'ASSIGNMENT' && activeOutlineActivity && (
                            <AssignmentLauncherCard
                                enrollmentId={enrollment.id}
                                activity={activeOutlineActivity}
                            />
                        )}

                        {!selectedActivity && !isCompleted && (
                            <Card className="border-dashed border-2 border-border p-8 text-center bg-card/40">
                                <CardContent className="space-y-3">
                                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                                    <h4 className="text-sm font-semibold text-foreground">Select an Activity</h4>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                        Choose a lesson material, quiz assessment, or assignment from the course outline on the left to start learning.
                                    </p>
                                    {overview.current_activity && (
                                        <Button
                                            size="sm"
                                            onClick={handleContinueLearning}
                                            className="text-xs font-semibold gap-1.5"
                                        >
                                            <PlayCircle className="h-3.5 w-3.5" />
                                            <span>Continue Learning</span>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Active Material Content Viewer (fallback when overview is not yet loaded or in tests) */}
            {(!overview || !overview.modules || overview.modules.length === 0) && selectedMaterial && (
                <div className="space-y-2">
                    <h2 className="text-base font-bold text-foreground">Material Reader</h2>
                    <MaterialContentViewer
                        material={selectedMaterial}
                        enrollmentId={enrollment.id}
                        isCompleted={isMaterialCompleted(selectedMaterial)}
                        isCompleting={completeMaterialMutation.isPending}
                        onClose={() => setSelectedMaterial(null)}
                        onMarkComplete={handleMarkComplete}
                    />
                </div>
            )}

            {/* Curriculum Modules & Materials Checklist (Preserved for backward-compatibility & testing) */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                        Course Modules & Materials
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Click on any material to view its content or mark it as completed to advance your progress.
                    </p>
                </div>

                {isLoadingModules ? (
                    <div className="p-8 text-center rounded-xl border border-border bg-card/40 space-y-2 animate-pulse">
                        <div className="h-5 w-48 bg-muted/60 rounded-md mx-auto" />
                        <div className="h-4 w-64 bg-muted/40 rounded-md mx-auto" />
                    </div>
                ) : modules.length === 0 ? (
                    <Card className="border-dashed border-2 border-border bg-card/40 p-8 text-center">
                        <CardContent className="space-y-2">
                            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                No curriculum modules have been added to this course yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {modules.map((module, index) => {
                            const moduleMaterials = module.materials || [];
                            const moduleAssignments = module.assignments || [];
                            return (
                                <Card key={module.id} className="border-border bg-card overflow-hidden">
                                    <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b border-border/50">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                                    Module {index + 1}
                                                </span>
                                                <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
                                                    {module.title}
                                                </CardTitle>
                                                {module.description && (
                                                    <CardDescription className="text-xs text-muted-foreground">
                                                        {module.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {moduleMaterials.length} {moduleMaterials.length === 1 ? 'material' : 'materials'}
                                                </Badge>
                                                {moduleAssignments.length > 0 && (
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {moduleAssignments.length} {moduleAssignments.length === 1 ? 'assignment' : 'assignments'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4 sm:p-5 space-y-3">
                                        {moduleMaterials.length === 0 && moduleAssignments.length === 0 ? (
                                            <p className="text-xs text-muted-foreground py-2 italic">
                                                No materials or assignments published in this module.
                                            </p>
                                        ) : (
                                            <>
                                                {moduleMaterials.length > 0 && (
                                                    <div className="space-y-2">
                                                        {moduleMaterials.map((material) => (
                                                            <MaterialListItem
                                                                key={material.id}
                                                                material={material}
                                                                isCompleted={isMaterialCompleted(material)}
                                                                isSelected={selectedMaterial?.id === material.id}
                                                                isCompleting={
                                                                    completeMaterialMutation.isPending &&
                                                                    completeMaterialMutation.variables?.materialId === material.id
                                                                }
                                                                onSelect={(mat) => {
                                                                    setSelectedMaterial(mat);
                                                                    setSelectedActivity({ type: 'MATERIAL', id: mat.id });
                                                                }}
                                                                onMarkComplete={handleMarkComplete}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {moduleAssignments.length > 0 && (
                                                    <div className="pt-3 border-t border-border/50 space-y-2">
                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                            <ClipboardList className="h-3.5 w-3.5 text-primary" />
                                                            <span>Assignments</span>
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {moduleAssignments.map((assignment) => (
                                                                <div
                                                                    key={assignment.id}
                                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/70 bg-card hover:bg-muted/30 transition-colors gap-3"
                                                                    data-testid={`assignment-item-${assignment.id}`}
                                                                >
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs sm:text-sm font-semibold text-foreground">
                                                                                {assignment.title}
                                                                            </span>
                                                                            <Badge variant="outline" className="text-[10px]">
                                                                                Max: {assignment.max_score} pts
                                                                            </Badge>
                                                                            {assignment.is_required && (
                                                                                <Badge variant="secondary" className="text-[10px]">
                                                                                    Required
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {assignment.due_at && (
                                                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                                <Clock className="h-3 w-3" />
                                                                                <span>Due: {new Date(assignment.due_at).toLocaleDateString()}</span>
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <Button asChild size="sm" variant="outline" className="text-xs shrink-0">
                                                                        <Link to={`/my-learning/${enrollmentId}/assignments/${assignment.id}`}>
                                                                            View Assignment
                                                                        </Link>
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Course Assessment Section: Rendered ONLY when explicit quiz_id is provided via query string */}
                {explicitQuizId && (
                    <Card className="border-border bg-card shadow-xs overflow-hidden" data-testid="course-assessment-card">
                        <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                        Evaluation
                                    </span>
                                    <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                                        <Award className="h-4 w-4 text-primary" />
                                        <span>Course Assessment</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Authoritative evaluation required to demonstrate competency and fulfill certificate criteria.
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-semibold">
                                    Assessment
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground">
                                Complete the assessment quiz to test your comprehension of the curriculum.
                            </div>
                            <Button
                                asChild
                                size="sm"
                                className="gap-1.5 text-xs font-semibold shrink-0 w-full sm:w-auto"
                                data-testid="start-assessment-cta"
                            >
                                <Link to={`/my-learning/${enrollmentId}/quizzes/${explicitQuizId}`}>
                                    <span>Start Assessment</span>
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default LearningPlayerPage;
