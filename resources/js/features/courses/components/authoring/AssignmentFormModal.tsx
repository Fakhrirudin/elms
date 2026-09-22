import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Award, RotateCcw } from 'lucide-react';
import { Assignment, CreateAssignmentPayload, UpdateAssignmentPayload } from '@/features/assessments/types/assignment';

interface AssignmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment?: Assignment | null;
    moduleId: number;
    onSubmit: (payload: CreateAssignmentPayload | UpdateAssignmentPayload) => Promise<void>;
    isSubmitting: boolean;
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
    isOpen,
    onClose,
    assignment,
    moduleId,
    onSubmit,
    isSubmitting,
}) => {
    const isEditing = Boolean(assignment);

    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [dueAt, setDueAt] = useState('');
    const [maxScore, setMaxScore] = useState<number>(100);
    const [maxAttempts, setMaxAttempts] = useState<number>(1);
    const [isRequired, setIsRequired] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (assignment) {
            setTitle(assignment.title);
            setInstructions(assignment.instructions);
            setDueAt(assignment.due_at ? assignment.due_at.substring(0, 16) : '');
            setMaxScore(assignment.max_score);
            setMaxAttempts(assignment.max_attempts);
            setIsRequired(assignment.is_required);
        } else {
            setTitle('');
            setInstructions('');
            setDueAt('');
            setMaxScore(100);
            setMaxAttempts(1);
            setIsRequired(true);
        }
        setError(null);
    }, [assignment, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError('Assignment title is required.');
            return;
        }

        if (!instructions.trim()) {
            setError('Instructions are required.');
            return;
        }

        const payload: CreateAssignmentPayload = {
            title: title.trim(),
            instructions: instructions.trim(),
            due_at: dueAt ? new Date(dueAt).toISOString() : null,
            max_score: Number(maxScore) || 100,
            max_attempts: Number(maxAttempts) || 1,
            is_required: isRequired,
        };

        try {
            await onSubmit(payload);
            onClose();
        } catch (err: any) {
            const message = err.response?.data?.message || err.message || 'Failed to save assignment.';
            setError(message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                    <h3 className="font-bold text-foreground text-base">
                        {isEditing ? 'Edit Assignment' : 'Add Assignment to Module'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label htmlFor="assignment-title" className="block text-xs font-semibold text-foreground mb-1">
                            Assignment Title <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="assignment-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Practical Project: REST API Implementation"
                            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="assignment-instructions" className="block text-xs font-semibold text-foreground mb-1">
                            Instructions & Requirements <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            id="assignment-instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Detail what students should prepare, technical requirements, submission format, etc."
                            rows={5}
                            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="assignment-due" className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Due Date & Time</span>
                            </label>
                            <input
                                id="assignment-due"
                                type="datetime-local"
                                value={dueAt}
                                onChange={(e) => setDueAt(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <p className="text-[10px] text-muted-foreground mt-0.5">Leave empty for no deadline.</p>
                        </div>

                        <div>
                            <label htmlFor="assignment-max-score" className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Max Score</span>
                            </label>
                            <input
                                id="assignment-max-score"
                                type="number"
                                min={1}
                                max={1000}
                                value={maxScore}
                                onChange={(e) => setMaxScore(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="assignment-max-attempts" className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Max Submission Attempts</span>
                            </label>
                            <input
                                id="assignment-max-attempts"
                                type="number"
                                min={1}
                                max={10}
                                value={maxAttempts}
                                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                required
                            />
                        </div>

                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isRequired}
                                    onChange={(e) => setIsRequired(e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="text-xs font-medium text-foreground">Required Assignment</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-md border border-input text-xs font-medium hover:bg-muted text-muted-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                            {isSubmitting ? 'Saving...' : isEditing ? 'Update Assignment' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignmentFormModal;
