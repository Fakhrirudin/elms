import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    Clock,
    Calendar,
    Award,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    FileText,
    UploadCloud,
    Download,
    Check,
    MessageSquare,
    Layers,
    History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    useAssignment,
    useMySubmissions,
    useSubmitAssignment,
} from '@/features/assessments/hooks/useAssignments';
import { AssignmentSubmission, SubmissionStatus } from '@/features/assessments/types/assignment';
import assignmentService from '@/features/assessments/services/assignmentService';

export const AssignmentPlayerPage: React.FC = () => {
    const { enrollmentId, assignmentId } = useParams<{ enrollmentId: string; assignmentId: string }>();
    const { user } = useAuth();

    const {
        data: assignment,
        isLoading: isLoadingAssignment,
        isError: isErrorAssignment,
        error: errorAssignment,
    } = useAssignment(assignmentId);

    const {
        data: submissions = [],
        isLoading: isLoadingSubmissions,
        refetch: refetchSubmissions,
    } = useMySubmissions(assignmentId);

    const submitMutation = useSubmitAssignment(assignmentId || '');

    // Form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [comment, setComment] = useState<string>('');
    const [fileError, setFileError] = useState<string | null>(null);
    const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

    const latestSubmission: AssignmentSubmission | undefined = submissions[0];
    const attemptCount = submissions.length;
    const maxAttempts = assignment?.max_attempts || 1;

    // Deadline checks
    const isPastDue = assignment?.due_at ? new Date() > new Date(assignment.due_at) : false;
    const hasDeadline = Boolean(assignment?.due_at);

    // Can student submit?
    const isUnderReview = latestSubmission?.status === 'SUBMITTED' || latestSubmission?.status === 'UNDER_REVIEW';
    const isPassed = latestSubmission?.status === 'PASSED';
    const needsRevision = latestSubmission?.status === 'NEEDS_REVISION';
    const attemptsExhausted = attemptCount >= maxAttempts;

    const canSubmit =
        assignment?.status === 'PUBLISHED' &&
        !isPastDue &&
        !isPassed &&
        !isUnderReview &&
        (!attemptsExhausted || (attemptCount === 0));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // 10 MB limit check
        if (file.size > 10 * 1024 * 1024) {
            setFileError('File size exceeds 10 MB limit. Please select a smaller file.');
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFileError(null);
        setSubmissionSuccess(false);

        if (!selectedFile) {
            setFileError('Please select a file to submit.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        if (comment.trim()) {
            formData.append('comment', comment.trim());
        }

        submitMutation.mutate(formData, {
            onSuccess: () => {
                setSelectedFile(null);
                setComment('');
                setSubmissionSuccess(true);
                refetchSubmissions();
            },
            onError: (err: any) => {
                const message =
                    err.response?.data?.message ||
                    err.response?.data?.errors?.deadline?.[0] ||
                    err.response?.data?.errors?.attempts?.[0] ||
                    err.response?.data?.errors?.resubmission?.[0] ||
                    err.message ||
                    'Failed to submit assignment.';
                setFileError(message);
            },
        });
    };

    const handleDownload = async (sub: AssignmentSubmission) => {
        try {
            await assignmentService.downloadSubmissionFile(sub.id, sub.original_filename);
        } catch (err) {
            console.error('Download error', err);
        }
    };

    const getStatusBadge = (status?: SubmissionStatus) => {
        switch (status) {
            case 'PASSED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950/80 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                    </span>
                );
            case 'NEEDS_REVISION':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-800 bg-amber-100 dark:text-amber-200 dark:bg-amber-950/80 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5" /> Needs Revision
                    </span>
                );
            case 'UNDER_REVIEW':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-950/80 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> Under Review
                    </span>
                );
            case 'SUBMITTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary bg-primary/10 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Submitted
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-muted-foreground bg-muted rounded-full">
                        Not Submitted
                    </span>
                );
        }
    };

    if (isLoadingAssignment || isLoadingSubmissions) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
                <div className="h-6 w-48 bg-muted rounded" />
                <div className="h-40 bg-muted/60 rounded-xl" />
                <div className="h-64 bg-muted/40 rounded-xl" />
            </div>
        );
    }

    if (isErrorAssignment || !assignment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Assignment Not Found or Access Denied</h2>
                <p className="text-xs text-muted-foreground">
                    {errorAssignment?.message || 'You must be actively enrolled in this course to view this assignment.'}
                </p>
                <Link
                    to={`/my-learning/${enrollmentId}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline mt-4"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Course
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Breadcrumb & Return Link */}
            <div className="flex items-center gap-2">
                <Link
                    to={`/my-learning/${enrollmentId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Learning Syllabus</span>
                </Link>
            </div>

            {/* Assignment Header Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                            Practical Assessment
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            {assignment.title}
                        </h1>
                    </div>
                    <div>{getStatusBadge(latestSubmission?.status)}</div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/20">
                        <Award className="w-5 h-5 text-primary shrink-0" />
                        <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                Max Points
                            </span>
                            <span className="text-xs font-bold text-foreground">{assignment.max_score} Points</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/20">
                        <RotateCcw className="w-5 h-5 text-primary shrink-0" />
                        <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                Attempt Limit
                            </span>
                            <span className="text-xs font-bold text-foreground">
                                Attempt {attemptCount} of {maxAttempts}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/20">
                        <Calendar className="w-5 h-5 text-primary shrink-0" />
                        <div>
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                                Due Date
                            </span>
                            <span className="text-xs font-bold text-foreground">
                                {assignment.due_at
                                    ? new Date(assignment.due_at).toLocaleDateString(undefined, {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : 'No Deadline'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assignment Instructions */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Instructions & Requirements</span>
                </h3>
                <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/10 p-4 rounded-lg border border-border">
                    {assignment.instructions}
                </div>
            </div>

            {/* Evaluation Result Banner (if graded) */}
            {latestSubmission && (latestSubmission.score !== null || latestSubmission.feedback) && (
                <div
                    className={`border rounded-xl p-5 space-y-3 shadow-xs ${
                        latestSubmission.status === 'PASSED'
                            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                            : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                    }`}
                >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            {latestSubmission.status === 'PASSED' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            )}
                            <h4 className="text-sm font-bold text-foreground">
                                {latestSubmission.status === 'PASSED' ? 'Evaluation Result: Passed' : 'Evaluation Result: Revision Required'}
                            </h4>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-extrabold text-foreground">
                                Score: {latestSubmission.score} / {assignment.max_score}
                            </span>
                        </div>
                    </div>

                    {latestSubmission.feedback && (
                        <div className="text-xs bg-card/80 p-3.5 rounded-lg border border-border/70 space-y-1">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                                Instructor Feedback:
                            </span>
                            <p className="text-muted-foreground whitespace-pre-wrap">{latestSubmission.feedback}</p>
                            {latestSubmission.reviewer && (
                                <p className="text-[10px] text-muted-foreground/80 pt-1">
                                    Evaluated by {latestSubmission.reviewer.name}
                                    {latestSubmission.reviewed_at
                                        ? ` on ${new Date(latestSubmission.reviewed_at).toLocaleDateString()}`
                                        : ''}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Submission Form / Status Banner */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-primary" />
                    <span>Submit Your Work</span>
                </h3>

                {submissionSuccess && (
                    <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Your submission has been uploaded successfully and is now pending review.</span>
                    </div>
                )}

                {isPassed ? (
                    <div className="p-4 bg-muted/20 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>You have already passed this assignment. No further submissions are required.</span>
                    </div>
                ) : isUnderReview ? (
                    <div className="p-4 bg-muted/20 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                            Your attempt #{latestSubmission?.attempt_number} is currently pending instructor review.
                            You will be able to resubmit if revision is requested.
                        </span>
                    </div>
                ) : isPastDue ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>The deadline for this assignment has passed. New submissions are no longer accepted.</span>
                    </div>
                ) : attemptsExhausted ? (
                    <div className="p-4 bg-muted/20 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>You have reached the maximum allowed submission attempts ({maxAttempts}).</span>
                    </div>
                ) : assignment?.status === 'CLOSED' ? (
                    <div className="p-4 bg-muted/20 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>This assignment is closed and no longer accepting submissions.</span>
                    </div>
                ) : canSubmit ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fileError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{fileError}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Select File (PDF, Word, Excel, PPT, TXT, ZIP, Images - max 10MB) <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,image/*"
                                className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer border border-input rounded-md bg-background"
                                required
                            />
                            {selectedFile && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    Selected: <span className="font-semibold text-foreground">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="student-comment" className="block text-xs font-semibold text-foreground mb-1">
                                Optional Comments / Notes for Instructor
                            </label>
                            <textarea
                                id="student-comment"
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Describe your methodology, links to repository or live demo, notes on implementation, etc."
                                className="w-full px-3 py-2 text-xs bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitMutation.isPending || !selectedFile}
                                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-xs"
                            >
                                {submitMutation.isPending
                                    ? 'Uploading Submission...'
                                    : needsRevision
                                    ? `Submit Revision (Attempt ${attemptCount + 1} of ${maxAttempts})`
                                    : 'Submit Assignment'}
                            </button>
                        </div>
                    </form>
                ) : null}
            </div>

            {/* Submission History Section */}
            {submissions.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        <span>Submission History ({submissions.length})</span>
                    </h3>

                    <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                        {submissions.map((sub) => (
                            <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/20 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-foreground">
                                            Attempt #{sub.attempt_number}
                                        </span>
                                        {getStatusBadge(sub.status)}
                                        {sub.score !== null && sub.score !== undefined && (
                                            <span className="text-xs font-bold text-foreground">
                                                • Score: {sub.score}/{assignment.max_score}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Submitted on {new Date(sub.submitted_at).toLocaleString()}
                                    </p>
                                    {sub.comment && (
                                        <p className="text-xs text-foreground/80 bg-muted/30 p-2 rounded mt-1">
                                            "{sub.comment}"
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDownload(sub)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-input hover:bg-muted text-foreground transition-colors self-start sm:self-center shrink-0"
                                >
                                    <Download className="w-3.5 h-3.5 text-primary" />
                                    <span>Download File</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentPlayerPage;
