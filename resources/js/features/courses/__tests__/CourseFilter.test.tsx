import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CourseFilter from '../components/CourseFilter';
import { Category } from '../types';

describe('CourseFilter', () => {
    const mockCategories: Category[] = [
        { id: 1, name: 'Diplomacy', slug: 'diplomacy' },
        { id: 2, name: 'Technology', slug: 'technology' },
    ];

    const defaultProps = {
        search: '',
        categoryId: undefined,
        sortOption: 'newest' as const,
        categories: mockCategories,
        isLoadingCategories: false,
        onSearchChange: vi.fn(),
        onCategoryChange: vi.fn(),
        onSortChange: vi.fn(),
        onReset: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('debounces search input and triggers onSearchChange after delay', () => {
        render(<CourseFilter {...defaultProps} />);

        const searchInput = screen.getByLabelText(/search courses/i);
        fireEvent.change(searchInput, { target: { value: 'Protocol' } });

        // Not called immediately
        expect(defaultProps.onSearchChange).not.toHaveBeenCalled();

        // Advance timers by 350ms
        act(() => {
            vi.advanceTimersByTime(350);
        });

        expect(defaultProps.onSearchChange).toHaveBeenCalledWith('Protocol');
    });

    it('clears search input immediately when clear button is clicked', () => {
        render(<CourseFilter {...defaultProps} search="Existing Term" />);

        const clearBtn = screen.getByLabelText(/clear search/i);
        fireEvent.click(clearBtn);

        expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
    });

    it('calls onCategoryChange when selecting category dropdown', () => {
        render(<CourseFilter {...defaultProps} />);

        const select = screen.getByLabelText(/filter by category/i);
        fireEvent.change(select, { target: { value: '2' } });

        expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(2);
    });

    it('calls onCategoryChange when clicking quick category pill', () => {
        render(<CourseFilter {...defaultProps} />);

        const techPill = screen.getByRole('button', { name: 'Technology' });
        fireEvent.click(techPill);

        expect(defaultProps.onCategoryChange).toHaveBeenCalledWith(2);
    });

    it('calls onSortChange when changing sorting selector', () => {
        render(<CourseFilter {...defaultProps} />);

        const sortSelect = screen.getByLabelText(/sort courses/i);
        fireEvent.change(sortSelect, { target: { value: 'title_asc' } });

        expect(defaultProps.onSortChange).toHaveBeenCalledWith('title_asc');
    });

    it('shows reset button when active filters exist and triggers onReset', () => {
        render(<CourseFilter {...defaultProps} search="Query" />);

        const resetBtn = screen.getByRole('button', { name: /reset all filters/i });
        expect(resetBtn).toBeInTheDocument();

        fireEvent.click(resetBtn);
        expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
    });
});
