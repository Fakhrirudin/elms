import React, { useState } from 'react';
import {
    X,
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    User as UserIcon,
    ChevronRight,
    Search,
    Filter,
} from 'lucide-react';
import {
    Assignment,
    AssignmentSubmission,
    SubmissionStatus,
    ReviewSubmissionPayload,
} from '@/features/assessments/types/assignment';
import {
    useAssignmentSubmissions,
    useReviewSubmission,
    useStartReview,
} from '@/features/assessments/hooks/useAssignments';
import assignmentService from '@/features/assessments/services/assignmentService';

interface AssignmentSubmissionsReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
}

export const AssignmentSubmissionsReviewModal: React.FC<AssignmentSubmissionsReviewModalProps> = ({
    isOpen,
    onClose,
    assignment,
}) => {
    if (!isOpen || !assignment) return null;

    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);

    // Grading form state
    const [reviewStatus, setReviewStatus] = useState<'PASSED' | 'NEEDS_REVISION'>('PASSED');
    const [reviewScore, setReviewScore] = useState<number>(assignment.max_score);
    const [reviewFeedback, setReviewFeedback] = useState<string>('');
    const [gradingError, setGradingError] = useState<string | null>(null);

    const {
        data: submissionsResult,
        isLoading,
        refetch,
    } = useAssignmentSubmissions(assignment.id, {
        status: statusFilter || undefined,
        search: searchQuery || undefined,
    });

    const startReviewMutation = useStartReview(assignment.id);
    const reviewMutation = useReviewSubmission(assignment.id);

    const submissions = submissionsResult?.submissions || [];

    const handleSelectSubmission = (sub: AssignmentSubmission) => {
        setSelectedSubmission(sub);
        setReviewStatus(sub.status === 'NEEDS_REVISION' ? 'NEEDS_REVISION' : 'PASSED');
        setReviewScore(sub.score !== null && sub.score !== undefined ? sub.score : assignment.max_score);
        setReviewFeedback(sub.feedback || '');
        setGradingError(null);

        // Auto mark as under review if submitted
        if (sub.status === 'SUBMITTED') {
            startReviewMutation.mutate(sub.id, {
                onSuccess: () => {
                    refetch();
                },
            });
        }
    };

    const handleDownload = async (sub: AssignmentSubmission) => {
        try {
            await assignmentService.downloadSubmissionFile(sub.id, sub.original_filename);
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    const handleSubmitGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmission) return;
        setGradingError(null);

        const scoreNum = Number(reviewScore);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > assignment.max_score) {
            setGradingError(`Score must be between 0 and ${assignment.max_score}.`);
            return;
        }

        if (reviewStatus === 'NEEDS_REVISION' && !reviewFeedback.trim()) {
            setGradingError('Feedback is required when marking as Needs Revision.');
            return;
        }

        const payload: ReviewSubmissionPayload = {
            status: reviewStatus,
            score: scoreNum,
            feedback: reviewFeedback.trim() || null,
        };

        try {
            const updated = await reviewMutation.mutateAsync({
                submissionId: selectedSubmission.id,
                payload,
            });
            setSelectedSubmission(updated);
            refetch();
        } catch (err: any) {
            setGradingError(err.response?.data?.message || err.message || 'Failed to submit evaluation.');
        }
    };

    const getStatusBadge = (status: SubmissionStatus) => {
        switch (status) {
            case 'PASSED':
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Passed
                    </span>
                );
            case 'NEEDS_REVISION':
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Needs Revision
                    </span>
                );
            case 'UNDER_REVIEW':
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Under Review
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Submitted
                    </span>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                                Submissions & Grading
                            </span>
                            <span className="text-xs text-muted-foreground">• Max Score: {assignment.max_score}</span>
                            <span className="text-xs text-muted-foreground">• Max Attempts: {assignment.max_attempts}</span>
                        </div>
                        <h3 className="font-bold text-foreground text-base mt-0.5">{assignment.title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Submissions Split Pane */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left Pane: Submissions List */}
                    <div className="w-full md:w-1/2 border-r border-border flex flex-col h-full overflow-hidden">
                        {/* Filters */}
                        <div className="p-3 border-b border-border bg-muted/10 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by student..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-2 py-1.5 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="UNDER_REVIEW">Under Review</option>
                                    <option value="PASSED">Passed</option>
                                    <option value="NEEDS_REVISION">Needs Revision</option>
                                </select>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-border">
                            {isLoading ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">Loading submissions...</div>
                            ) : submissions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    No submissions found for this assignment.
                                </div>
                            ) : (
                                submissions.map((sub) => {
                                    const isSelected = selectedSubmission?.id === sub.id;
                                    return (
                                        <div
                                            key={sub.id}
                                            onClick={() => handleSelectSubmission(sub)}
                                            className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-primary/10 border-l-4 border-primary'
                                                    : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            <div className="space-y-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-foreground truncate">
                                                        {sub.user?.name || 'Student'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        Attempt #{sub.attempt_number}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-muted-foreground truncate">
                                                    {sub.user?.email} {sub.user?.department ? `• ${sub.user.department}` : ''}
                                                </div>
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    {getStatusBadge(sub.status)}
                                                    {sub.score !== null && sub.score !== undefined && (
                                                        <span className="text-[10px] font-bold text-foreground">
                                                            Score: {sub.score}/{assignment.max_score}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Submission Detail & Grading Form */}
                    <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto p-6 bg-card">
                        {!selectedSubmission ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                                <UserIcon className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm font-medium">Select a submission to review and grade</p>
                                <p className="text-xs mt-1">
                                    Click on any student submission from the list on the left.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Student Info & Submission Details */}
                                <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-foreground">
                                                {selectedSubmission.user?.name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedSubmission.user?.email}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-foreground">
                                                Attempt #{selectedSubmission.attempt_number}
                                            </span>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(selectedSubmission.submitted_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Student Comment */}
                                    {selectedSubmission.comment && (
                                        <div className="text-xs bg-card p-2.5 rounded border border-border">
                                            <span className="font-semibold text-foreground block mb-0.5">
                                                Learner Comment:
                                            </span>
                                            <p className="text-muted-foreground">{selectedSubmission.comment}</p>
                                        </div>
                                    )}

                                    {/* File attachment */}
                                    <div className="flex items-center justify-between p-2.5 bg-card rounded border border-border">
                                        <div className="flex items-center gap-2 min-w-0 pr-2">
                                            <Download className="w-4 h-4 text-primary shrink-0" />
                                            <span className="text-xs font-medium text-foreground truncate">
                                                {selectedSubmission.original_filename}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                ({(selectedSubmission.file_size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDownload(selectedSubmission)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>

                                {/* Evaluation & Grading Form */}
                                <form onSubmit={handleSubmitGrade} className="space-y-4 pt-2">
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                        Evaluation & Grading
                                    </h4>

                                    {gradingError && (
                                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-xs">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{gradingError}</span>
                                        </div>
                                    )}

                                    {/* Status decision */}
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                                            Evaluation Status <span className="text-destructive">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setReviewStatus('PASSED')}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                                                    reviewStatus === 'PASSED'
                                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200'
                                                        : 'bg-background border-input text-muted-foreground hover:bg-muted'
                                                }`}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Passed
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setReviewStatus('NEEDS_REVISION')}
                                                className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                                                    reviewStatus === 'NEEDS_REVISION'
                                                        ? 'bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200'
                                                        : 'bg-background border-input text-muted-foreground hover:bg-muted'
                                                }`}
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                Needs Revision
                                            </button>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div>
                                        <label htmlFor="eval-score" className="block text-xs font-semibold text-foreground mb-1">
                                            Score (0 to {assignment.max_score}) <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            id="eval-score"
                                            type="number"
                                            min={0}
                                            max={assignment.max_score}
                                            value={reviewScore}
                                            onChange={(e) => setReviewScore(Number(e.target.value))}
                                            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    {/* Feedback */}
                                    <div>
                                        <label htmlFor="eval-feedback" className="block text-xs font-semibold text-foreground mb-1">
                                            Instructor Feedback {reviewStatus === 'NEEDS_REVISION' && <span className="text-destructive">*</span>}
                                        </label>
                                        <textarea
                                            id="eval-feedback"
                                            rows={4}
                                            value={reviewFeedback}
                                            onChange={(e) => setReviewFeedback(e.target.value)}
                                            placeholder={
                                                reviewStatus === 'NEEDS_REVISION'
                                                    ? 'Clearly describe what corrections or revisions are required for the next attempt...'
                                                    : 'Add constructive feedback or commendations on the submission...'
                                            }
                                            className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                                            required={reviewStatus === 'NEEDS_REVISION'}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={reviewMutation.isPending}
                                            className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-xs"
                                        >
                                            {reviewMutation.isPending ? 'Saving Evaluation...' : 'Submit Evaluation'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentSubmissionsReviewModal;
