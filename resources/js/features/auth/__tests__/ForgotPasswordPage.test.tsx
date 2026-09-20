import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
    default: {
        forgotPassword: vi.fn(),
    },
}));

const renderForgotPasswordPage = () => {
    return render(
        <MemoryRouter>
            <ForgotPasswordPage />
        </MemoryRouter>
    );
};

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders heading, description, email input, and submit button', () => {
        renderForgotPasswordPage();

        expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
        expect(screen.getByText('Forgot Password')).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('validates email field on submission', async () => {
        renderForgotPasswordPage();

        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        expect(await screen.findByText('Email address is required')).toBeInTheDocument();
        expect(authService.forgotPassword).not.toHaveBeenCalled();

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'invalid-email' } });
        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
        expect(authService.forgotPassword).not.toHaveBeenCalled();
    });

    it('submits request and shows generic success confirmation screen', async () => {
        (authService.forgotPassword as any).mockResolvedValueOnce({
            success: true,
            message: 'If the account exists, a password reset link has been sent.',
        });

        renderForgotPasswordPage();

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'learner@elms.test' },
        });

        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        await waitFor(() => {
            expect(authService.forgotPassword).toHaveBeenCalledWith({
                email: 'learner@elms.test',
            });
        });

        expect(await screen.findByText('Check your email for a password reset link.')).toBeInTheDocument();
        expect(screen.getByText(/learner@elms.test/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /return to sign in/i })).toBeInTheDocument();
    });

    it('displays error alert when request fails', async () => {
        (authService.forgotPassword as any).mockRejectedValueOnce({
            response: {
                status: 500,
                data: { message: 'Failed to deliver email' },
            },
        });

        renderForgotPasswordPage();

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'learner@elms.test' },
        });

        fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Failed to deliver email');
    });
});
