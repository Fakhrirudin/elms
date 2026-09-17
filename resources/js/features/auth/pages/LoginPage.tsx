import React from 'react';
import LoginForm from '../components/LoginForm';

export const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-sm mb-1">
                        E
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        ELMS Portal
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Employee Learning Management System
                    </p>
                </div>

                <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-6 sm:p-8">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
                        <p className="text-xs text-muted-foreground">
                            Enter your credentials to access your learning portal
                        </p>
                    </div>

                    <LoginForm />
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    ELMS Portfolio Prototype • Modular Monolith Architecture
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
