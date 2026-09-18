import React from 'react';
import { Question } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface QuestionItemProps {
    question: Question;
    index: number;
    selectedOptionId?: number;
    onSelectOption: (questionId: number, optionId: number) => void;
    disabled?: boolean;
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
    question,
    index,
    selectedOptionId,
    onSelectOption,
    disabled = false,
}) => {
    return (
        <Card
            className="border-border bg-card shadow-xs overflow-hidden"
            data-testid={`question-card-${question.id}`}
        >
            <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                    </span>
                    <CardTitle className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                        {question.question}
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-2.5">
                {question.options.map((option, optIdx) => {
                    const isSelected = selectedOptionId === option.id;
                    const optionInputId = `q-${question.id}-opt-${option.id}`;

                    return (
                        <label
                            key={option.id}
                            htmlFor={optionInputId}
                            className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs sm:text-sm cursor-pointer transition-all duration-150 select-none ${isSelected
                                    ? 'border-primary bg-primary/5 text-foreground font-medium ring-1 ring-primary/30 shadow-xs'
                                    : 'border-border/70 hover:border-border hover:bg-muted/40 text-muted-foreground'
                                } ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
                            data-testid={`question-option-${option.id}`}
                        >
                            <div className="pt-0.5">
                                <input
                                    type="radio"
                                    id={optionInputId}
                                    name={`question-${question.id}`}
                                    value={option.id}
                                    checked={isSelected}
                                    disabled={disabled}
                                    onChange={() => onSelectOption(question.id, option.id)}
                                    className="h-4 w-4 text-primary border-muted-foreground focus:ring-primary focus:ring-offset-background"
                                />
                            </div>
                            <div className="flex-1 leading-relaxed">
                                <span className="mr-2 font-mono text-xs text-muted-foreground font-bold uppercase">
                                    {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span>{option.option_text}</span>
                            </div>
                        </label>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default QuestionItem;

