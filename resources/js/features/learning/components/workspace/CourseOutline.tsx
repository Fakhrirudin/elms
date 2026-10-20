import React from 'react';
import { ModuleOutline, ModuleOutlineActivity, ActivityType } from '../../types';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Video,
    File,
    HelpCircle,
    ClipboardList,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronDown,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';

interface CourseOutlineProps {
    modules: ModuleOutline[];
    selectedActivity: { type: ActivityType; id: number } | null;
    onSelectActivity: (activity: ModuleOutlineActivity) => void;
}

export const CourseOutline: React.FC<CourseOutlineProps> = ({
    modules,
    selectedActivity,
    onSelectActivity,
}) => {
    // State to track collapsed modules (all expanded by default)
    const [collapsedModules, setCollapsedModules] = React.useState<Record<number, boolean>>({});

    const toggleModule = (moduleId: number) => {
        setCollapsedModules((prev) => ({
            ...prev,
            [moduleId]: !prev[moduleId],
        }));
    };

    const getActivityIcon = (activity: ModuleOutlineActivity) => {
        if (activity.type === 'QUIZ') {
            return <HelpCircle className="h-4 w-4 shrink-0 text-amber-500" />;
        }
        if (activity.type === 'ASSIGNMENT') {
            return <ClipboardList className="h-4 w-4 shrink-0 text-indigo-500" />;
        }
        // MATERIAL
        switch (activity.material_type) {
            case 'VIDEO':
                return <Video className="h-4 w-4 shrink-0 text-blue-500" />;
            case 'PDF':
                return <File className="h-4 w-4 shrink-0 text-rose-500" />;
            default:
                return <FileText className="h-4 w-4 shrink-0 text-teal-500" />;
        }
    };

    const getActivityStatusIndicator = (activity: ModuleOutlineActivity) => {
        if (activity.type === 'MATERIAL') {
            if (activity.status === 'COMPLETED') {
                return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
            }
            return <span className="h-2 w-2 rounded-full bg-border shrink-0" />;
        }

        if (activity.type === 'QUIZ') {
            if (activity.status === 'PASSED') {
                return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
            }
            if (activity.status === 'FAILED') {
                return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
            }
            return <span className="h-2 w-2 rounded-full bg-border shrink-0" />;
        }

        if (activity.type === 'ASSIGNMENT') {
            if (activity.status === 'PASSED') {
                return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
            }
            if (activity.status === 'NEEDS_REVISION') {
                return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
            }
            if (activity.status === 'SUBMITTED' || activity.status === 'UNDER_REVIEW') {
                return <Clock className="h-4 w-4 text-blue-500 shrink-0" />;
            }
            return <span className="h-2 w-2 rounded-full bg-border shrink-0" />;
        }

        return null;
    };

    return (
        <div className="space-y-3" data-testid="course-outline">
            <div className="flex items-center justify-between px-1 pb-1">
                <h3 className="text-sm font-semibold text-foreground">Course Outline</h3>
                <span className="text-[11px] text-muted-foreground font-medium">
                    {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
                </span>
            </div>

            <div className="space-y-3">
                {modules.map((module, index) => {
                    const isCollapsed = collapsedModules[module.id];
                    const isCompleted = module.is_completed;

                    return (
                        <div
                            key={module.id}
                            className="rounded-lg border border-border/80 bg-card overflow-hidden transition-colors"
                            data-testid={`outline-module-${module.id}`}
                        >
                            {/* Module Header */}
                            <button
                                type="button"
                                onClick={() => toggleModule(module.id)}
                                className="w-full p-3 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-left gap-2 border-b border-border/40"
                            >
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                                            Module {index + 1}
                                        </span>
                                        {isCompleted && (
                                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[9px] py-0 px-1.5 h-3.5">
                                                Done
                                            </Badge>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground truncate">
                                        {module.title}
                                    </h4>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                                    <span className="text-[10px] font-medium">
                                        {module.completed_required}/{module.total_required}
                                    </span>
                                    {isCollapsed ? (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                </div>
                            </button>

                            {/* Module Activities */}
                            {!isCollapsed && (
                                <div className="p-1 space-y-0.5">
                                    {module.activities.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground p-3 text-center italic">
                                            No published activities in this module.
                                        </p>
                                    ) : (
                                        module.activities.map((activity) => {
                                            const isSelected =
                                                selectedActivity?.type === activity.type &&
                                                selectedActivity?.id === activity.id;

                                            return (
                                                <button
                                                    key={`${activity.type}-${activity.id}`}
                                                    type="button"
                                                    onClick={() => onSelectActivity(activity)}
                                                    className={`w-full p-2.5 rounded-md flex items-center justify-between gap-2 text-left transition-all text-xs ${isSelected
                                                            ? 'bg-primary/10 border border-primary/30 text-primary font-medium shadow-xs'
                                                            : 'hover:bg-muted/50 text-foreground'
                                                        }`}
                                                    data-testid={`activity-item-${activity.type.toLowerCase()}-${activity.id}`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {getActivityIcon(activity)}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="truncate">{activity.title}</span>
                                                                {activity.is_required && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-[9px] py-0 px-1 h-3 text-muted-foreground shrink-0"
                                                                    >
                                                                        Req
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        {getActivityStatusIndicator(activity)}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CourseOutline;
