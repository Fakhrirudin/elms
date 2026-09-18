import React from 'react';

export const QuizSkeleton: React.FC = () => {
    return (
        <div data-testid="quiz-skeleton" className="space-y-6 max-w-3xl mx-auto animate-pulse">
            <div className="h-6 w-36 bg-muted/60 rounded-md" />
            <div className="h-48 w-full bg-muted/50 rounded-xl" />
            <div className="space-y-4">
                <div className="h-32 w-full bg-muted/40 rounded-xl" />
                <div className="h-32 w-full bg-muted/40 rounded-xl" />
            </div>
        </div>
    );
};

export default QuizSkeleton;

