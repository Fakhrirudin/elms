import React, { useState } from 'react';
import { CourseModule } from '../../types';
import MaterialItem from './MaterialItem';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Layers, BookOpen } from 'lucide-react';

interface ModuleAccordionProps {
    modules: CourseModule[];
}

export const ModuleAccordion: React.FC<ModuleAccordionProps> = ({ modules }) => {
    // By default, expand the first module or all modules if only few
    const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        modules.forEach((mod, index) => {
            initial[mod.id] = index === 0; // First module open by default
        });
        return initial;
    });

    const toggleModule = (id: number) => {
        setExpandedModules((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const toggleAll = (expand: boolean) => {
        const updated: Record<number, boolean> = {};
        modules.forEach((mod) => {
            updated[mod.id] = expand;
        });
        setExpandedModules(updated);
    };

    if (modules.length === 0) {
        return (
            <div className="p-8 text-center rounded-xl border border-dashed border-border bg-card/40 space-y-2">
                <Layers className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <h4 className="text-sm font-semibold text-foreground">No Modules Published Yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    The syllabus for this course is being prepared by the assigned instructors. Check back soon.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header controls */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span>{modules.length} {modules.length === 1 ? 'Module' : 'Modules'} Total</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => toggleAll(true)}
                        className="hover:text-foreground hover:underline focus:outline-hidden"
                    >
                        Expand All
                    </button>
                    <span>•</span>
                    <button
                        type="button"
                        onClick={() => toggleAll(false)}
                        className="hover:text-foreground hover:underline focus:outline-hidden"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Modules List */}
            <div className="space-y-3">
                {modules.map((module, index) => {
                    const isExpanded = expandedModules[module.id] ?? false;
                    const materials = module.materials || [];
                    const mandatoryCount = materials.filter((m) => m.is_mandatory).length;

                    return (
                        <Card
                            key={module.id}
                            data-testid={`module-card-${module.id}`}
                            className="border-border overflow-hidden bg-card transition-colors"
                        >
                            {/* Module Header / Toggle */}
                            <button
                                type="button"
                                onClick={() => toggleModule(module.id)}
                                className="w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-muted/30 focus:outline-hidden transition-colors"
                                aria-expanded={isExpanded}
                                aria-label={`Toggle module: ${module.title}`}
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="text-[11px] font-mono font-medium px-2 py-0.5"
                                        >
                                            Module {index + 1}
                                        </Badge>
                                        <h4 className="text-sm sm:text-base font-semibold text-foreground">
                                            {module.title}
                                        </h4>
                                    </div>

                                    {module.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                                            {module.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
                                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                                        {materials.length} {materials.length === 1 ? 'lesson' : 'lessons'}
                                        {mandatoryCount > 0 && ` (${mandatoryCount} mandatory)`}
                                    </span>
                                    <div className="h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Collapsible Content: Materials */}
                            {isExpanded && (
                                <div className="p-4 sm:p-5 pt-0 border-t border-border/50 space-y-2 bg-muted/10">
                                    <div className="pt-3">
                                        {materials.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic py-2">
                                                No learning materials in this module yet.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {materials.map((material, matIndex) => (
                                                    <MaterialItem
                                                        key={material.id}
                                                        material={material}
                                                        index={matIndex}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default ModuleAccordion;

