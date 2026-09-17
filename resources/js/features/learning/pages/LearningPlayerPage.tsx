import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useEnrollment from '../hooks/useEnrollment';
import useLearningProgress from '../hooks/useLearningProgress';
import useCompleteMaterial from '../hooks/useCompleteMaterial';
import useCourseModules from '@/features/courses/hooks/useCourseModules';
import { Material } from '@/features/courses/types';
import EnrollmentStatusBadge from '../components/EnrollmentStatusBadge';
import MaterialListItem from '../components/player/MaterialListItem';
import MaterialContentViewer from '../components/player/MaterialContentViewer';
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
} from 'lucide-react';

export const LearningPlayerPage: React.FC = () => {
    const { enrollmentId } = useParams<{ enrollmentId: string }>();

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
    } = useLearningProgress(enrollmentId);

    // 4. Material Completion Mutation
    const completeMaterialMutation = useCompleteMaterial();

    // 5. In-memory Completed Materials & Selected Material State
    const [completedMaterialIds, setCompletedMaterialIds] = useState<Set<number>>(new Set());
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

    const handleMarkComplete = (materialId: number) => {
        if (!enrollmentId) return;

        completeMaterialMutation.mutate(
            { enrollmentId, materialId },
            {
                onSuccess: (result) => {
                    setCompletedMaterialIds((prev) => new Set([...prev, result.material_id]));
                },
            }
        );
    };

    // Helper: Determine if a material is completed
    const isMaterialCompleted = (material: Material): boolean => {
        if (completedMaterialIds.has(material.id)) {
            return true;
        }
        // If course is already completed in backend, all mandatory materials are finished
        if (progress?.status === 'COMPLETED' && material.is_mandatory) {
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
    const progressPercentage = progress?.progress ?? 0;
    const totalMandatory = progress?.total_mandatory_materials ?? 0;
    const completedMandatory = progress?.completed_mandatory_materials ?? 0;
    const currentStatus = progress?.status ?? enrollment.status;

    const instructorNames = course?.instructors && course.instructors.length > 0
        ? course.instructors.map((i) => i.name).join(', ')
        : 'Assigned Instructors';

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
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
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                            <span>{progressPercentage}% Completed</span>
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

            {/* Active Material Content Viewer (if material is selected) */}
            {selectedMaterial && (
                <div className="space-y-2">
                    <h2 className="text-base font-bold text-foreground">Material Reader</h2>
                    <MaterialContentViewer
                        material={selectedMaterial}
                        isCompleted={isMaterialCompleted(selectedMaterial)}
                        isCompleting={completeMaterialMutation.isPending}
                        onClose={() => setSelectedMaterial(null)}
                        onMarkComplete={handleMarkComplete}
                    />
                </div>
            )}

            {/* Curriculum Modules & Materials Checklist */}
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
                                            <Badge variant="outline" className="text-[10px]">
                                                {moduleMaterials.length} {moduleMaterials.length === 1 ? 'material' : 'materials'}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4 sm:p-5 space-y-2.5">
                                        {moduleMaterials.length === 0 ? (
                                            <p className="text-xs text-muted-foreground py-2 italic">
                                                No materials published in this module.
                                            </p>
                                        ) : (
                                            moduleMaterials.map((material) => (
                                                <MaterialListItem
                                                    key={material.id}
                                                    material={material}
                                                    isCompleted={isMaterialCompleted(material)}
                                                    isSelected={selectedMaterial?.id === material.id}
                                                    isCompleting={
                                                        completeMaterialMutation.isPending &&
                                                        completeMaterialMutation.variables?.materialId === material.id
                                                    }
                                                    onSelect={(mat) => setSelectedMaterial(mat)}
                                                    onMarkComplete={handleMarkComplete}
                                                />
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningPlayerPage;

