import React, { useState } from 'react';
import { CheckCircle2, Archive, AlertCircle, ShieldAlert } from 'lucide-react';
import { CourseStatus } from '../../types';
import { useAuth } from '@/context/AuthContext';

interface CourseStatusActionsProps {
    currentStatus: CourseStatus;
    onUpdateStatus: (newStatus: CourseStatus) => Promise<void>;
    isUpdating: boolean;
}

export const CourseStatusActions: React.FC<CourseStatusActionsProps> = ({
    currentStatus,
    onUpdateStatus,
    isUpdating,
}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';
    const [confirmAction, setConfirmAction] = useState<CourseStatus | null>(null);

    const handleConfirm = async () => {
        if (!confirmAction) return;
        try {
            await onUpdateStatus(confirmAction);
            setConfirmAction(null);
        } catch {
            // Error handled by mutation hook
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
                <div>
                    <h3 className="text-base font-semibold text-foreground">Course Lifecycle</h3>
                    <p className="text-xs text-muted-foreground">
                        Manage course availability: Draft → Published → Archived.
                    </p>
                </div>
                <div>
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentStatus === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : currentStatus === 'ARCHIVED'
                                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                    >
                        Status: {currentStatus}
                    </span>
                </div>
            </div>

            {/* Lifecycle Transition Buttons */}
            {isAdmin ? (
                <div className="space-y-3">
                    {currentStatus === 'DRAFT' && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                            <div>
                                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                    Ready to Publish?
                                </h4>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                    Publishing makes the course visible to learners in the public course catalog.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => setConfirmAction('PUBLISHED')}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors shrink-0 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Publish Course
                            </button>
                        </div>
                    )}

                    {currentStatus === 'PUBLISHED' && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                            <div>
                                <h4 className="text-sm font-semibold text-foreground">Retire Course?</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Archived courses cannot be newly enrolled. Existing learner enrollments and history remain preserved.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => setConfirmAction('ARCHIVED')}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-colors shrink-0 disabled:opacity-50"
                            >
                                <Archive className="w-4 h-4" />
                                Archive Course
                            </button>
                        </div>
                    )}

                    {currentStatus === 'ARCHIVED' && (
                        <div className="p-3.5 rounded-lg bg-muted text-muted-foreground text-xs">
                            This course is archived and closed for new enrollments.
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                    <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                    <span>
                        Course status publishing and archiving are managed by Institutional Administrators.
                    </span>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center gap-2.5 text-foreground">
                            <AlertCircle className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">
                                Confirm {confirmAction === 'PUBLISHED' ? 'Publishing' : 'Archiving'}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {confirmAction === 'PUBLISHED'
                                ? 'Are you sure you want to publish this course? It will immediately become visible to learners in the public course catalog.'
                                : 'Are you sure you want to archive this course? New learners will no longer be able to enroll, while existing learner progress is preserved.'}
                        </p>
                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => setConfirmAction(null)}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isUpdating}
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${confirmAction === 'PUBLISHED'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-slate-700 hover:bg-slate-800'
                                    }`}
                            >
                                {isUpdating ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseStatusActions;
