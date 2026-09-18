import React from 'react';
import { Link } from 'react-router-dom';
import { Quiz } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, CheckCircle2, Clock, HelpCircle, Play, AlertCircle } from 'lucide-react';

interface QuizIntroCardProps {
    quiz: Quiz;
    enrollmentId: string | number;
    isStarting: boolean;
    onStartAttempt: () => void;
    errorMessage?: string | null;
}

export const QuizIntroCard: React.FC<QuizIntroCardProps> = ({
    quiz,
    enrollmentId,
    isStarting,
    onStartAttempt,
    errorMessage,
}) => {
    const questionCount = quiz.questions?.length ?? quiz.questions_count ?? 0;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
            >
                <Link to={`/my-learning/${enrollmentId}`}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Learning Player</span>
                </Link>
            </Button>

            <Card className="border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="p-6 sm:p-8 space-y-4 bg-muted/20 border-b border-border/60">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-semibold gap-1">
                            <Award className="h-3 w-3 text-primary" />
                            <span>Course Assessment</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium">
                            Passing Grade: {quiz.passing_grade}%
                        </Badge>
                        <Badge variant="outline" className="text-xs font-medium">
                            Max Attempts: {quiz.max_attempts}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                            {quiz.title}
                        </CardTitle>
                        {quiz.description && (
                            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {quiz.description}
                            </CardDescription>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Error Banner if any */}
                    {errorMessage && (
                        <div
                            role="alert"
                            className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs sm:text-sm flex items-start gap-2.5"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold">Unable to start assessment</p>
                                <p className="text-destructive/90">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Assessment Rules & Specifications */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            <span>Assessment Information & Rules</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-1">
                                <span className="font-medium text-foreground">Total Questions</span>
                                <p className="text-muted-foreground">
                                    {questionCount} multiple-choice {questionCount === 1 ? 'question' : 'questions'}
                                </p>
                            </div>
                            <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-1">
                                <span className="font-medium text-foreground">Passing Requirement</span>
                                <p className="text-muted-foreground">
                                    Minimum score of {quiz.passing_grade}% required to pass
                                </p>
                            </div>
                            <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-1">
                                <span className="font-medium text-foreground">Attempt Policy</span>
                                <p className="text-muted-foreground">
                                    Up to {quiz.max_attempts} attempts allowed
                                </p>
                            </div>
                            {quiz.time_limit_minutes && (
                                <div className="p-3.5 rounded-lg border border-border/80 bg-background space-y-1">
                                    <span className="font-medium text-foreground">Suggested Time Limit</span>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{quiz.time_limit_minutes} minutes (self-paced)</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground space-y-2">
                        <p className="font-medium text-foreground">Before you begin:</p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Each question has exactly one correct answer.</li>
                            <li>Your authoritative score is computed by the server upon submission.</li>
                            <li>Ensure you have a stable network connection before starting.</li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="p-6 sm:p-8 pt-0 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-xs"
                    >
                        <Link to={`/my-learning/${enrollmentId}`}>Cancel & Return</Link>
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        onClick={onStartAttempt}
                        disabled={isStarting}
                        className="w-full sm:w-auto gap-2 text-xs font-semibold"
                        data-testid="start-quiz-btn"
                    >
                        {isStarting ? (
                            <span>Starting Attempt...</span>
                        ) : (
                            <>
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Start Quiz Attempt</span>
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default QuizIntroCard;

