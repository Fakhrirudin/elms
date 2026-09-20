import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users, AlertCircle, Shield } from 'lucide-react';
import { CourseInstructor, InstructorCandidate } from '../../types';
import courseService from '../../services/courseService';
import useCourseAuthoring from '../../hooks/useCourseAuthoring';
import { useAuth } from '@/context/AuthContext';

interface CourseInstructorsManagerProps {
    courseId: number | string;
    instructors: CourseInstructor[];
}

export const CourseInstructorsManager: React.FC<CourseInstructorsManagerProps> = ({
    courseId,
    instructors,
}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'LEARNING_ADMIN';

    const { assignInstructor, isAssigningInstructor, removeInstructor, isRemovingInstructor } =
        useCourseAuthoring(courseId);

    const [candidates, setCandidates] = useState<InstructorCandidate[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdmin) return;

        let isMounted = true;
        setIsLoadingCandidates(true);
        courseService
            .getInstructorCandidates()
            .then((data) => {
                if (isMounted) {
                    setCandidates(data);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setErrorMessage('Failed to load instructor candidates.');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingCandidates(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isAdmin]);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        if (!selectedUserId) return;

        try {
            await assignInstructor({
                targetCourseId: courseId,
                userId: Number(selectedUserId),
            });
            setSelectedUserId('');
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to assign instructor.');
        }
    };

    const handleRemove = async (userId: number, name: string) => {
        if (!window.confirm(`Are you sure you want to remove ${name} from this course?`)) {
            return;
        }
        setErrorMessage(null);
        try {
            await removeInstructor({
                targetCourseId: courseId,
                userId,
            });
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Failed to remove instructor.');
        }
    };

    // Filter candidates who are not already assigned
    const assignedIds = new Set(instructors.map((i) => i.id));
    const availableCandidates = candidates.filter((c) => !assignedIds.has(c.id));

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Course Instructors</h3>
                        <p className="text-xs text-muted-foreground">
                            Instructors assigned to this course can view, author syllabus content, and grade learners.
                        </p>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Assigned Instructors List */}
            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Instructors ({instructors.length})
                </h4>

                {instructors.length === 0 ? (
                    <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground">
                        No instructors assigned yet.
                    </div>
                ) : (
                    <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                        {instructors.map((inst) => (
                            <div
                                key={inst.id}
                                className="flex items-center justify-between p-3.5 bg-card hover:bg-muted/20 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                        {inst.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{inst.name}</p>
                                        <p className="text-xs text-muted-foreground">{inst.email}</p>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <button
                                        type="button"
                                        disabled={isRemovingInstructor}
                                        onClick={() => handleRemove(inst.id, inst.name)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                        title="Remove instructor from course"
                                    >
                                        <UserMinus className="w-3.5 h-3.5" />
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assign Instructor Form (Admin Only) */}
            {isAdmin ? (
                <form onSubmit={handleAssign} className="pt-2 border-t border-border space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Assign New Instructor
                    </h4>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            disabled={isLoadingCandidates || availableCandidates.length === 0}
                            className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                        >
                            <option value="">
                                {isLoadingCandidates
                                    ? 'Loading instructor candidates...'
                                    : availableCandidates.length === 0
                                        ? 'All instructors already assigned'
                                        : 'Select an instructor to assign...'}
                            </option>
                            {availableCandidates.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                    {candidate.name} ({candidate.email})
                                </option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            disabled={!selectedUserId || isAssigningInstructor}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <UserPlus className="w-4 h-4" />
                            {isAssigningInstructor ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    <span>Instructor assignment is restricted to institutional administrators.</span>
                </div>
            )}
        </div>
    );
};

export default CourseInstructorsManager;
