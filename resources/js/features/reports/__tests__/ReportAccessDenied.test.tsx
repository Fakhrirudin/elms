import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ReportAccessDenied from '../components/ReportAccessDenied';

describe('ReportAccessDenied', () => {
    it('renders access denied heading and custom report name description', () => {
        render(
            <MemoryRouter>
                <ReportAccessDenied reportName="Course Performance" />
            </MemoryRouter>
        );

        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(
            screen.getByText(/You do not have permission to view Course Performance reports/i)
        ).toBeInTheDocument();
    });

    it('renders navigation link back to learning progress report', () => {
        render(
            <MemoryRouter>
                <ReportAccessDenied />
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: /Go to My Learning Progress/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/reports/learning');
    });
});
