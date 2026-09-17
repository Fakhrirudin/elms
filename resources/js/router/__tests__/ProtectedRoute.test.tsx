import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthContext, AuthContextType } from '@/context/AuthContext';

const renderWithContext = (
    contextValue: Partial<AuthContextType>,
    initialPath = '/protected'
) => {
    const defaultContext: AuthContextType = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        ...contextValue,
    };

    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <AuthContext.Provider value={defaultContext}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/protected" element={<div>Protected Content</div>} />
                    </Route>
                </Routes>
            </AuthContext.Provider>
        </MemoryRouter>
    );
};

describe('ProtectedRoute', () => {
    it('shows loading spinner when authentication is loading', () => {
        renderWithContext({ isLoading: true });

        expect(screen.getByText('Memuat sesi pengguna...')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });

    it('redirects to /login when unauthenticated', () => {
        renderWithContext({ isLoading: false, isAuthenticated: false });

        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders protected child component when authenticated', () => {
        renderWithContext({
            isLoading: false,
            isAuthenticated: true,
            user: {
                id: 1,
                name: 'Super Admin',
                email: 'superadmin@elms.test',
                role: 'SUPER_ADMIN',
                department_id: null,
                department: null,
                is_active: true,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            },
            token: 'valid-token',
        });

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
});
