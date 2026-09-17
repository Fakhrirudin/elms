import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MetricCard from '../components/MetricCard';
import { BookOpen } from 'lucide-react';

describe('MetricCard', () => {
    it('renders label, numeric value, and description', () => {
        render(
            <MetricCard
                label="Total Courses"
                value={12}
                icon={BookOpen}
                accent="blue"
                description="All enrolled courses"
            />
        );

        expect(screen.getByText('Total Courses')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('All enrolled courses')).toBeInTheDocument();
    });

    it('renders formatted string value correctly', () => {
        render(
            <MetricCard
                label="Average Quiz Score"
                value="88.5%"
                icon={BookOpen}
                accent="amber"
            />
        );

        expect(screen.getByText('Average Quiz Score')).toBeInTheDocument();
        expect(screen.getByText('88.5%')).toBeInTheDocument();
    });
});

