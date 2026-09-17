import React from 'react';
import { Material } from '@/features/courses/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    BookOpen,
    Video,
    FileText,
    CheckCircle2,
    Loader2,
    X,
} from 'lucide-react';

interface MaterialContentViewerProps {
    material: Material | null;
    isCompleted: boolean;
    isCompleting: boolean;
    onClose: () => void;
    onMarkComplete: (materialId: number) => void;
}

export const MaterialContentViewer: React.FC<MaterialContentViewerProps> = ({
    material,
    isCompleted,
    isCompleting,
    onClose,
    onMarkComplete,
}) => {
    if (!material) {
        return null;
    }

    const renderContent = () => {
        switch (material.type) {
            case 'TEXT':
                return (
                    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {material.content || 'No text content available for this material.'}
                    </div>
                );
            case 'VIDEO':
                return (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
                            <Video className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h4 className="text-sm font-semibold text-foreground">
                                Instructional Video Material
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Video resource URL: {material.video_url || 'URL not configured'}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 italic pt-1">
                                Video streaming is managed by external media providers.
                            </p>
                        </div>
                    </div>
                );
            case 'PDF':
                return (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 max-w-md mx-auto">
                            <h4 className="text-sm font-semibold text-foreground">
                                Document Attachment
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                File resource: {material.file_path || 'Document file reference'}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 italic pt-1">
                                Document binary storage managed by backend filesystem.
                            </p>
                        </div>
                    </div>
                );
            default:
                return (
                    <p className="text-xs text-muted-foreground">
                        Material content preview unavailable.
                    </p>
                );
        }
    };

    return (
        <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                            {material.type}
                        </Badge>
                        <Badge
                            variant={material.is_mandatory ? 'outline' : 'secondary'}
                            className="text-[10px] uppercase font-mono tracking-wider"
                        >
                            {material.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Badge>
                        {isCompleted && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] uppercase font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                                Completed
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                        {material.title}
                    </CardTitle>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    aria-label="Close material reader"
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 min-h-[140px]">
                {renderContent()}
            </CardContent>

            <CardFooter className="p-4 sm:p-5 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    {isCompleted
                        ? 'You have finished this material.'
                        : 'Review this material and mark it as completed to advance your course progress.'}
                </span>

                <div className="flex items-center gap-2">
                    {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Completed</span>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            disabled={isCompleting}
                            onClick={() => onMarkComplete(material.id)}
                            className="text-xs font-medium gap-1.5"
                        >
                            {isCompleting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Mark as Completed</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

export default MaterialContentViewer;

