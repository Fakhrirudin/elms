import React, { useState } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    FileText,
    Video,
    FileCode,
    ChevronDown,
    ChevronUp,
    Layers,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';
import { CourseModule, Material, MaterialType } from '../../types';
import useCourseAuthoring from '../../hooks/useCourseAuthoring';

interface CourseStructureEditorProps {
    courseId: number | string;
    modules: CourseModule[];
    isLoading: boolean;
}

export const CourseStructureEditor: React.FC<CourseStructureEditorProps> = ({
    courseId,
    modules,
    isLoading,
}) => {
    const {
        createModule,
        isCreatingModule,
        updateModule,
        isUpdatingModule,
        deleteModule,
        isDeletingModule,
        createMaterial,
        isCreatingMaterial,
        updateMaterial,
        isUpdatingMaterial,
        deleteMaterial,
        isDeletingMaterial,
    } = useCourseAuthoring(courseId);

    // Collapsed module state
    const [collapsedModules, setCollapsedModules] = useState<Record<number, boolean>>({});

    // Module modal state
    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
    const [moduleTitle, setModuleTitle] = useState('');
    const [moduleDescription, setModuleDescription] = useState('');
    const [moduleSortOrder, setModuleSortOrder] = useState<number>(1);

    // Material modal state
    const [materialModalOpen, setMaterialModalOpen] = useState(false);
    const [targetModuleId, setTargetModuleId] = useState<number | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialType, setMaterialType] = useState<MaterialType>('TEXT');
    const [materialContent, setMaterialContent] = useState('');
    const [materialVideoUrl, setMaterialVideoUrl] = useState('');
    const [materialFilePath, setMaterialFilePath] = useState('');
    const [materialSortOrder, setMaterialSortOrder] = useState<number>(1);
    const [materialIsMandatory, setMaterialIsMandatory] = useState<boolean>(true);

    const [formError, setFormError] = useState<string | null>(null);

    const toggleCollapse = (id: number) => {
        setCollapsedModules((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Open module modal
    const openAddModule = () => {
        setEditingModule(null);
        setModuleTitle('');
        setModuleDescription('');
        setModuleSortOrder((modules.length + 1) * 10);
        setFormError(null);
        setModuleModalOpen(true);
    };

    const openEditModule = (mod: CourseModule) => {
        setEditingModule(mod);
        setModuleTitle(mod.title);
        setModuleDescription(mod.description || '');
        setModuleSortOrder(mod.sort_order);
        setFormError(null);
        setModuleModalOpen(true);
    };

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!moduleTitle.trim()) {
            setFormError('Module title is required.');
            return;
        }

        try {
            if (editingModule) {
                await updateModule({
                    moduleId: editingModule.id,
                    payload: {
                        title: moduleTitle.trim(),
                        description: moduleDescription.trim() || null,
                        sort_order: moduleSortOrder,
                    },
                });
            } else {
                await createModule({
                    targetCourseId: courseId,
                    payload: {
                        title: moduleTitle.trim(),
                        description: moduleDescription.trim() || null,
                        sort_order: moduleSortOrder,
                    },
                });
            }
            setModuleModalOpen(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to save module.');
        }
    };

    const handleDeleteModule = async (moduleId: number) => {
        if (!window.confirm('Are you sure you want to delete this module and all its materials?')) {
            return;
        }
        try {
            await deleteModule(moduleId);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete module.');
        }
    };

    // Open material modal
    const openAddMaterial = (moduleId: number) => {
        setTargetModuleId(moduleId);
        setEditingMaterial(null);
        setMaterialTitle('');
        setMaterialType('TEXT');
        setMaterialContent('');
        setMaterialVideoUrl('');
        setMaterialFilePath('');
        const mod = modules.find((m) => m.id === moduleId);
        setMaterialSortOrder(((mod?.materials?.length || 0) + 1) * 10);
        setMaterialIsMandatory(true);
        setFormError(null);
        setMaterialModalOpen(true);
    };

    const openEditMaterial = (moduleId: number, mat: Material) => {
        setTargetModuleId(moduleId);
        setEditingMaterial(mat);
        setMaterialTitle(mat.title);
        setMaterialType(mat.type);
        setMaterialContent(mat.content || '');
        setMaterialVideoUrl(mat.video_url || '');
        setMaterialFilePath(mat.file_path || '');
        setMaterialSortOrder(mat.sort_order);
        setMaterialIsMandatory(mat.is_mandatory);
        setFormError(null);
        setMaterialModalOpen(true);
    };

    const handleSaveMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!materialTitle.trim()) {
            setFormError('Material title is required.');
            return;
        }

        try {
            if (editingMaterial) {
                await updateMaterial({
                    materialId: editingMaterial.id,
                    payload: {
                        title: materialTitle.trim(),
                        type: materialType,
                        content: materialType === 'TEXT' ? materialContent.trim() || null : null,
                        video_url: materialType === 'VIDEO' ? materialVideoUrl.trim() || null : null,
                        file_path: materialType === 'PDF' ? materialFilePath.trim() || null : null,
                        sort_order: materialSortOrder,
                        is_mandatory: materialIsMandatory,
                    },
                });
            } else if (targetModuleId) {
                await createMaterial({
                    moduleId: targetModuleId,
                    payload: {
                        title: materialTitle.trim(),
                        type: materialType,
                        content: materialType === 'TEXT' ? materialContent.trim() || null : null,
                        video_url: materialType === 'VIDEO' ? materialVideoUrl.trim() || null : null,
                        file_path: materialType === 'PDF' ? materialFilePath.trim() || null : null,
                        sort_order: materialSortOrder,
                        is_mandatory: materialIsMandatory,
                    },
                });
            }
            setMaterialModalOpen(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to save material.');
        }
    };

    const handleDeleteMaterial = async (materialId: number) => {
        if (!window.confirm('Are you sure you want to delete this material?')) {
            return;
        }
        try {
            await deleteMaterial(materialId);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete material.');
        }
    };

    const getMaterialIcon = (type: MaterialType) => {
        switch (type) {
            case 'VIDEO':
                return <Video className="w-4 h-4 text-rose-500" />;
            case 'PDF':
                return <FileCode className="w-4 h-4 text-amber-500" />;
            case 'TEXT':
            default:
                return <FileText className="w-4 h-4 text-blue-500" />;
        }
    };

    if (isLoading) {
        return (
            <div className="bg-card border border-border rounded-xl p-8 text-center shadow-sm">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading curriculum structure...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Course Structure</h3>
                    <p className="text-xs text-muted-foreground">
                        Organize curriculum into modules and learning materials (reading text, videos, documents).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAddModule}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Module
                </button>
            </div>

            {modules.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                    <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">No modules created yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Build your course outline by adding your first curriculum module.
                    </p>
                    <button
                        type="button"
                        onClick={openAddModule}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create Module
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {modules.map((mod, index) => {
                        const isCollapsed = Boolean(collapsedModules[mod.id]);
                        const materialsCount = mod.materials?.length || 0;

                        return (
                            <div
                                key={mod.id}
                                className="bg-card border border-border rounded-xl shadow-sm overflow-hidden transition-all"
                            >
                                {/* Module Header */}
                                <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer select-none flex-1"
                                        onClick={() => toggleCollapse(mod.id)}
                                    >
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground"
                                            aria-label={isCollapsed ? 'Expand module' : 'Collapse module'}
                                        >
                                            {isCollapsed ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronUp className="w-4 h-4" />
                                            )}
                                        </button>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Module {index + 1}
                                            </span>
                                            <span className="text-sm font-semibold text-foreground">
                                                {mod.title}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto sm:ml-0">
                                            {materialsCount} {materialsCount === 1 ? 'material' : 'materials'}
                                        </span>
                                    </div>

                                    {/* Module Actions */}
                                    <div className="flex items-center gap-1.5 ml-3">
                                        <button
                                            type="button"
                                            onClick={() => openEditModule(mod)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                                            title="Edit module"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isDeletingModule}
                                            onClick={() => handleDeleteModule(mod.id)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                            title="Delete module"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Module Content (Materials List) */}
                                {!isCollapsed && (
                                    <div className="p-4 space-y-3">
                                        {mod.description && (
                                            <p className="text-xs text-muted-foreground mb-3">{mod.description}</p>
                                        )}

                                        {materialsCount === 0 ? (
                                            <div className="text-center py-4 bg-muted/20 border border-dashed border-border rounded-lg">
                                                <p className="text-xs text-muted-foreground">
                                                    No materials in this module yet.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                                                {mod.materials?.map((mat) => (
                                                    <div
                                                        key={mat.id}
                                                        className="flex items-center justify-between p-3 bg-card hover:bg-muted/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {getMaterialIcon(mat.type)}
                                                            <div>
                                                                <span className="text-sm font-medium text-foreground">
                                                                    {mat.title}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                        {mat.type}
                                                                    </span>
                                                                    {mat.is_mandatory ? (
                                                                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                                                                            Mandatory
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            Optional
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditMaterial(mod.id, mat)}
                                                                className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                                                                title="Edit material"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isDeletingMaterial}
                                                                onClick={() => handleDeleteMaterial(mat.id)}
                                                                className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                                                title="Delete material"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => openAddMaterial(mod.id)}
                                            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-1"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add Material to Module {index + 1}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Module Modal */}
            {moduleModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <h3 className="text-lg font-bold text-foreground">
                            {editingModule ? 'Edit Module' : 'Add New Module'}
                        </h3>

                        {formError && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveModule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Module Title <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Introduction & Fundamentals"
                                    value={moduleTitle}
                                    onChange={(e) => setModuleTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief summary of this module..."
                                    value={moduleDescription}
                                    onChange={(e) => setModuleDescription(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModuleModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingModule || isUpdatingModule}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isCreatingModule || isUpdatingModule ? 'Saving...' : 'Save Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Material Modal */}
            {materialModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <h3 className="text-lg font-bold text-foreground">
                            {editingMaterial ? 'Edit Material' : 'Add Material'}
                        </h3>

                        {formError && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveMaterial} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Material Title <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Architectural Overview"
                                    value={materialTitle}
                                    onChange={(e) => setMaterialTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    Material Type
                                </label>
                                <select
                                    value={materialType}
                                    onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="TEXT">Reading Text (Markdown / Article)</option>
                                    <option value="VIDEO">Video Embed</option>
                                    <option value="PDF">PDF / Document</option>
                                </select>
                            </div>

                            {materialType === 'TEXT' && (
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">
                                        Reading Content
                                    </label>
                                    <textarea
                                        rows={5}
                                        placeholder="Detailed text content, notes, instructions, or markdown..."
                                        value={materialContent}
                                        onChange={(e) => setMaterialContent(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-xs"
                                    />
                                </div>
                            )}

                            {materialType === 'VIDEO' && (
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">
                                        Video URL
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={materialVideoUrl}
                                        onChange={(e) => setMaterialVideoUrl(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            )}

                            {materialType === 'PDF' && (
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">
                                        Document Path / Link
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="/documents/lesson-handout.pdf"
                                        value={materialFilePath}
                                        onChange={(e) => setMaterialFilePath(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    id="material-mandatory"
                                    type="checkbox"
                                    checked={materialIsMandatory}
                                    onChange={(e) => setMaterialIsMandatory(e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary/20 h-4 w-4"
                                />
                                <label htmlFor="material-mandatory" className="text-xs text-foreground font-medium select-none">
                                    Mandatory for course completion (counts toward learner progress percentage)
                                </label>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setMaterialModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingMaterial || isUpdatingMaterial}
                                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isCreatingMaterial || isUpdatingMaterial ? 'Saving...' : 'Save Material'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseStructureEditor;
