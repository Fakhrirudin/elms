import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionItem from '../components/QuestionItem';
import { Question } from '../types';

describe('QuestionItem', () => {
    const mockQuestion: Question = {
        id: 1,
        quiz_id: 10,
        question: 'What is the primary benefit of Modular Monolith?',
        sort_order: 1,
        options: [
            { id: 101, question_id: 1, option_text: 'Tightly coupled spaghetti code', sort_order: 1 },
            { id: 102, question_id: 1, option_text: 'Domain boundary isolation with single deployment unit', sort_order: 2 },
            { id: 103, question_id: 1, option_text: 'Mandatory distributed microservices network latency', sort_order: 3 },
        ],
    };

    it('renders question title, number, and all option texts', () => {
        const handleSelect = vi.fn();

        render(
            <QuestionItem
                question={mockQuestion}
                index={0}
                onSelectOption={handleSelect}
            />
        );

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('What is the primary benefit of Modular Monolith?')).toBeInTheDocument();
        expect(screen.getByText('Tightly coupled spaghetti code')).toBeInTheDocument();
        expect(screen.getByText('Domain boundary isolation with single deployment unit')).toBeInTheDocument();
        expect(screen.getByText('Mandatory distributed microservices network latency')).toBeInTheDocument();
    });

    it('calls onSelectOption with questionId and optionId when radio option is selected', () => {
        const handleSelect = vi.fn();

        render(
            <QuestionItem
                question={mockQuestion}
                index={0}
                onSelectOption={handleSelect}
            />
        );

        const option2 = screen.getByTestId('question-option-102');
        fireEvent.click(option2);

        expect(handleSelect).toHaveBeenCalledWith(1, 102);
    });

    it('marks selected radio button as checked when selectedOptionId matches', () => {
        const handleSelect = vi.fn();

        render(
            <QuestionItem
                question={mockQuestion}
                index={0}
                selectedOptionId={102}
                onSelectOption={handleSelect}
            />
        );

        const radio1 = screen.getByDisplayValue('101') as HTMLInputElement;
        const radio2 = screen.getByDisplayValue('102') as HTMLInputElement;

        expect(radio1.checked).toBe(false);
        expect(radio2.checked).toBe(true);
    });

    it('does not contain or expose any is_correct attribute or indicators', () => {
        const handleSelect = vi.fn();

        const { container } = render(
            <QuestionItem
                question={mockQuestion}
                index={0}
                onSelectOption={handleSelect}
            />
        );

        expect(container.innerHTML).not.toContain('is_correct');
        expect(container.innerHTML).not.toContain('Correct Answer');
    });

    it('disables radio inputs when disabled prop is true', () => {
        const handleSelect = vi.fn();

        render(
            <QuestionItem
                question={mockQuestion}
                index={0}
                onSelectOption={handleSelect}
                disabled={true}
            />
        );

        const radio1 = screen.getByDisplayValue('101') as HTMLInputElement;
        expect(radio1).toBeDisabled();
    });
});

