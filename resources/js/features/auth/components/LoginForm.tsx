import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

interface DemoAccount {
    role: string;
    email: string;
    color: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
    { role: 'Super Admin', email: 'superadmin@elms.test', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' },
    { role: 'Learning Admin', email: 'learningadmin@elms.test', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
    { role: 'Instructor', email: 'instructor@elms.test', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
    { role: 'Employee', email: 'employee@elms.test', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' },
];

export const LoginForm: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

    const handleSelectDemo = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('Password123!');
        setErrors({});
        setApiError(null);
    };

    const validate = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await login({ email, password });
            navigate(from, { replace: true });
        } catch (err) {
            const error = err as AxiosError<ApiError>;
            if (error.response?.data?.message) {
                setApiError(error.response.data.message);
            } else if (error.response?.status === 401) {
                setApiError('Invalid email or password');
            } else if (error.message) {
                setApiError(error.message);
            } else {
                setApiError('Unable to connect to server. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            {apiError && (
                <div
                    role="alert"
                    className="p-3 text-sm rounded-lg bg-destructive/15 text-destructive border border-destructive/20"
                >
                    {apiError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@elms.test"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                            to="/forgot-password"
                            className="text-xs text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        aria-invalid={!!errors.password}
                    />
                    {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Signing in...
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </Button>
            </form>

            <div className="pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
                    Quick Demo Credentials (Pre-seeded)
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                        <button
                            key={acc.email}
                            type="button"
                            onClick={() => handleSelectDemo(acc.email)}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-medium border text-left transition-colors ${acc.color}`}
                        >
                            <span className="block font-semibold">{acc.role}</span>
                            <span className="block text-[11px] opacity-80 truncate">{acc.email}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-2 text-center">
                <p className="text-xs text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="text-primary font-medium hover:underline">
                        Register as Employee
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
