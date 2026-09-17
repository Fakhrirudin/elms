import React from 'react';
import { Material } from '@/features/courses/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    Video,
    FileText,
    CheckCircle2,
    Circle,
    Loader2,
    Eye,
} from 'lucide-react';

interface MaterialListItemProps {
    material: Material;
    isCompleted: boolean;
    isSelected: boolean;
    isCompleting: boolean;
    onSelect: (material: Material) => void;
    onMarkComplete: (materialId: number) => void;
}

export const MaterialListItem: React.FC<MaterialListItemProps> = ({
    material,
    isCompleted,
    isSelected,
    isCompleting,
    onSelect,
    onMarkComplete,
}) => {
    // Determine icon based on material type
    const renderTypeIcon = () => {
        switch (material.type) {
            case 'VIDEO':
                return <Video className="h-4 w-4 text-sky-500 shrink-0" />;
            case 'PDF':
                return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
            case 'TEXT':
            default:
                return <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />;
        }
    };

    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors ${isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/60 bg-card hover:bg-muted/30'
                }`}
        >
            {/* Left Content: Completion Icon + Material Title & Metadata */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(material)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(material);
                    }
                }}
                className="flex items-start sm:items-center gap-3 flex-1 cursor-pointer text-left focus:outline-hidden"
            >
                <div className="pt-0.5 sm:pt-0 shrink-0">
                    {isCompleted ? (
                        <CheckCircle2
                            data-testid={`completed-icon-${material.id}`}
                            className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                        />
                    ) : (
                        <Circle
                            data-testid={`incomplete-icon-${material.id}`}
                            className="h-5 w-5 text-muted-foreground/50"
                        />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {renderTypeIcon()}
                    <span
                        className={`text-xs sm:text-sm font-medium ${isCompleted ? 'text-foreground/80' : 'text-foreground font-semibold'
                            }`}
                    >
                        {material.title}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 ml-auto sm:ml-2 shrink-0">
                    <Badge
                        variant={material.is_mandatory ? 'outline' : 'secondary'}
                        className={`text-[10px] uppercase font-mono tracking-wider ${material.is_mandatory
                                ? 'border-primary/30 text-primary bg-primary/5'
                                : 'text-muted-foreground'
                            }`}
                    >
                        {material.is_mandatory ? 'Mandatory' : 'Optional'}
                    </Badge>
                </div>
            </div>

            {/* Right Actions: View & Mark as Complete Button */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button
                    variant={isSelected ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onSelect(material)}
                    className="h-8 text-xs gap-1.5 px-2.5"
                >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                </Button>

                {isCompleted ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-md">
                        Done
                    </span>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isCompleting}
                        onClick={() => onMarkComplete(material.id)}
                        className="h-8 text-xs font-medium gap-1.5"
                    >
                        {isCompleting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Mark Complete</span>
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default MaterialListItem;

