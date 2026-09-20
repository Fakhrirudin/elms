import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
    default: {
        resetPassword: vi.fn(),
    },
}));

const renderResetPasswordPage = (queryString = '') => {
    return render(
        <MemoryRouter initialEntries={[`/reset-password${queryString}`]}>
            <ResetPasswordPage />
        </MemoryRouter>
    );
};

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows warning when token is missing from URL query string', () => {
        renderResetPasswordPage();

        expect(screen.getByText('Invalid or Missing Reset Link')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /request new reset link/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    });

    it('renders form and pre-fills email when token and email are in URL', () => {
        renderResetPasswordPage('?token=test-reset-token&email=learner%40elms.test');

        expect(screen.getByText('Create New Password')).toBeInTheDocument();
        const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
        expect(emailInput.value).toBe('learner@elms.test');
        expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('validates password mismatch on submission', async () => {
        renderResetPasswordPage('?token=test-reset-token&email=learner%40elms.test');

        fireEvent.change(screen.getByLabelText(/^new password/i), {
            target: { value: 'NewPassword123!' },
        });
        fireEvent.change(screen.getByLabelText(/confirm new password/i), {
            target: { value: 'Mismatch123!' },
        });

        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
        expect(authService.resetPassword).not.toHaveBeenCalled();
    });

    it('submits reset request and displays success screen with login navigation', async () => {
        (authService.resetPassword as any).mockResolvedValueOnce({
            success: true,
            message: 'Password has been reset successfully.',
        });

        renderResetPasswordPage('?token=valid-secret-token&email=learner%40elms.test');

        fireEvent.change(screen.getByLabelText(/^new password/i), {
            target: { value: 'BrandNewPassword123!' },
        });
        fireEvent.change(screen.getByLabelText(/confirm new password/i), {
            target: { value: 'BrandNewPassword123!' },
        });

        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(authService.resetPassword).toHaveBeenCalledWith({
                token: 'valid-secret-token',
                email: 'learner@elms.test',
                password: 'BrandNewPassword123!',
                password_confirmation: 'BrandNewPassword123!',
            });
        });

        expect(await screen.findByText('Password Reset Successful!')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /sign in now/i })).toBeInTheDocument();
    });

    it('displays error alert when reset token is invalid or expired', async () => {
        (authService.resetPassword as any).mockRejectedValueOnce({
            response: {
                status: 400,
                data: { message: 'This password reset token is invalid.' },
            },
        });

        renderResetPasswordPage('?token=expired-token&email=learner%40elms.test');

        fireEvent.change(screen.getByLabelText(/^new password/i), {
            target: { value: 'BrandNewPassword123!' },
        });
        fireEvent.change(screen.getByLabelText(/confirm new password/i), {
            target: { value: 'BrandNewPassword123!' },
        });

        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('This password reset token is invalid.');
        expect(screen.getByRole('link', { name: /request a new reset link/i })).toBeInTheDocument();
    });
});
