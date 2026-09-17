import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthContext, AuthContextType } from '@/context/AuthContext';

const mockLogin = vi.fn();
const mockLogout = vi.fn();

const defaultAuthContext: AuthContextType = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
};

const renderLoginPage = (contextValue: Partial<AuthContextType> = {}) => {
    return render(
        <MemoryRouter>
            <AuthContext.Provider value={{ ...defaultAuthContext, ...contextValue }}>
                <LoginPage />
            </AuthContext.Provider>
        </MemoryRouter>
    );
};

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the branding title, inputs, and submit button', () => {
        renderLoginPage();

        expect(screen.getByText('ELMS Portal')).toBeInTheDocument();
        expect(screen.getByText('Employee Learning Management System')).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    });

    it('displays client-side validation errors when submitting empty form', async () => {
        renderLoginPage();

        fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

        expect(await screen.findByText('Email is required')).toBeInTheDocument();
        expect(await screen.findByText('Password is required')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('populates credentials when a quick demo button is clicked', async () => {
        renderLoginPage();

        const superAdminBtn = screen.getByRole('button', { name: /super admin/i });
        fireEvent.click(superAdminBtn);

        const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

        expect(emailInput.value).toBe('superadmin@elms.test');
        expect(passwordInput.value).toBe('Password123!');
    });

    it('submits successfully when form has valid inputs', async () => {
        mockLogin.mockResolvedValueOnce({
            user: { id: 1, name: 'Super Admin', email: 'superadmin@elms.test', role: 'SUPER_ADMIN' },
            token: 'test-token',
        });

        renderLoginPage();

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'superadmin@elms.test' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'Password123!' },
        });

        fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'superadmin@elms.test',
                password: 'Password123!',
            });
        });
    });

    it('displays server error alert when login fails', async () => {
        mockLogin.mockRejectedValueOnce({
            response: {
                status: 401,
                data: { message: 'These credentials do not match our records.' },
            },
        });

        renderLoginPage();

        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: 'wrong@elms.test' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'WrongPassword' },
        });

        fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'These credentials do not match our records.'
        );
    });
});
