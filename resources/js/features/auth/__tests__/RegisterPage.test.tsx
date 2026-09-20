import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import { AuthContext, AuthContextType } from '@/context/AuthContext';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
    default: {
        getDepartments: vi.fn(),
        register: vi.fn(),
    },
}));

const mockRegister = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();

const defaultAuthContext: AuthContextType = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
};

const mockDepartments = [
    { id: 1, name: 'Teknologi Informasi' },
    { id: 2, name: 'Sumber Daya Manusia' },
];

const renderRegisterPage = (contextValue: Partial<AuthContextType> = {}) => {
    return render(
        <MemoryRouter>
            <AuthContext.Provider value={{ ...defaultAuthContext, ...contextValue }}>
                <RegisterPage />
            </AuthContext.Provider>
        </MemoryRouter>
    );
};

describe('RegisterPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (authService.getDepartments as any).mockResolvedValue(mockDepartments);
    });

    it('renders the header title, inputs, and submit button', async () => {
        renderRegisterPage();

        expect(screen.getByText('Create Account')).toBeInTheDocument();
        expect(screen.getByText('Employee Registration')).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/department/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register as employee/i })).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Teknologi Informasi')).toBeInTheDocument();
            expect(screen.getByText('Sumber Daya Manusia')).toBeInTheDocument();
        });
    });

    it('displays client-side validation errors when submitting empty form', async () => {
        renderRegisterPage();

        fireEvent.click(screen.getByRole('button', { name: /register as employee/i }));

        expect(await screen.findByText('Full name is required')).toBeInTheDocument();
        expect(await screen.findByText('Email is required')).toBeInTheDocument();
        expect(await screen.findByText('Please select your department')).toBeInTheDocument();
        expect(await screen.findByText('Password is required')).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('displays validation error when passwords do not match', async () => {
        renderRegisterPage();

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Budi' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'budi@elms.test' } });
        fireEvent.change(screen.getByLabelText(/department/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'MismatchedPass!' } });

        fireEvent.click(screen.getByRole('button', { name: /register as employee/i }));

        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('submits successfully when form has valid inputs', async () => {
        mockRegister.mockResolvedValueOnce({
            user: { id: 10, name: 'Budi', email: 'budi@elms.test', role: 'EMPLOYEE' },
            token: 'valid-test-token',
        });

        renderRegisterPage();

        await waitFor(() => {
            expect(screen.getByText('Teknologi Informasi')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Budi' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'budi@elms.test' } });
        fireEvent.change(screen.getByLabelText(/department/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('button', { name: /register as employee/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                name: 'Budi',
                email: 'budi@elms.test',
                department_id: 1,
                password: 'Password123!',
                password_confirmation: 'Password123!',
            });
        });
    });

    it('displays server error alert when registration fails', async () => {
        mockRegister.mockRejectedValueOnce({
            response: {
                status: 422,
                data: {
                    message: 'Validation failed',
                    errors: {
                        email: ['The email has already been taken.'],
                    },
                },
            },
        });

        renderRegisterPage();

        await waitFor(() => {
            expect(screen.getByText('Teknologi Informasi')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Budi' } });
        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'taken@elms.test' } });
        fireEvent.change(screen.getByLabelText(/department/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password123!' } });
        fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });

        fireEvent.click(screen.getByRole('button', { name: /register as employee/i }));

        expect(await screen.findByText('The email has already been taken.')).toBeInTheDocument();
        expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed');
    });
});
