import React from 'react';
import { Material } from '../../types';
import { Badge } from '@/components/ui/badge';
import { FileText, File, Video } from 'lucide-react';

interface MaterialItemProps {
    material: Material;
    index: number;
}

export const MaterialItem: React.FC<MaterialItemProps> = ({ material, index }) => {
    const renderTypeIcon = () => {
        switch (material.type) {
            case 'VIDEO':
                return <Video className="h-4 w-4 text-sky-500 shrink-0" />;
            case 'PDF':
                return <File className="h-4 w-4 text-rose-500 shrink-0" />;
            case 'TEXT':
            default:
                return <FileText className="h-4 w-4 text-emerald-500 shrink-0" />;
        }
    };

    return (
        <div
            data-testid={`material-item-${material.id}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-border/70 bg-background/60 hover:bg-muted/30 transition-colors"
        >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <span className="text-xs font-mono text-muted-foreground/80 w-5 shrink-0 pt-0.5 sm:pt-0">
                    {index + 1}.
                </span>
                <div className="flex items-center gap-2 min-w-0">
                    {renderTypeIcon()}
                    <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {material.title}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                {/* Type Badge */}
                <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5"
                >
                    {material.type}
                </Badge>

                {/* Mandatory / Optional Badge */}
                {material.is_mandatory ? (
                    <Badge
                        variant="secondary"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5"
                    >
                        Mandatory
                    </Badge>
                ) : (
                    <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5"
                    >
                        Optional
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default MaterialItem;

