import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import authService from '../services/authService';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export const ResetPasswordForm: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const initialEmail = searchParams.get('email') || '';

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        password_confirmation?: string;
    }>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!token) {
        return (
            <div className="w-full space-y-6 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-destructive/15 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                        Invalid or Missing Reset Link
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        This password reset link is missing a valid security token. Please request a new link.
                    </p>
                </div>
                <div className="pt-2">
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center justify-center w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="w-full space-y-6 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                        Password Reset Successful!
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Your password has been updated. You can now sign in using your new credentials.
                    </p>
                </div>
                <div className="pt-2">
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Sign In Now
                    </Link>
                </div>
            </div>
        );
    }

    const validate = (): boolean => {
        const newErrors: {
            email?: string;
            password?: string;
            password_confirmation?: string;
        } = {};

        if (!email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'New password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!passwordConfirmation) {
            newErrors.password_confirmation = 'Please confirm your new password';
        } else if (password !== passwordConfirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
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
            await authService.resetPassword({
                token,
                email: email.trim(),
                password,
                password_confirmation: passwordConfirmation,
            });
            setIsSuccess(true);
        } catch (err) {
            const errorObj = err as AxiosError<ApiError>;
            if (errorObj.response?.data?.errors) {
                const serverValidationErrors = errorObj.response.data.errors;
                const formattedErrors: {
                    email?: string;
                    password?: string;
                    password_confirmation?: string;
                } = {};

                if (serverValidationErrors.email?.[0]) {
                    formattedErrors.email = serverValidationErrors.email[0];
                }
                if (serverValidationErrors.password?.[0]) {
                    formattedErrors.password = serverValidationErrors.password[0];
                }
                if (serverValidationErrors.password_confirmation?.[0]) {
                    formattedErrors.password_confirmation = serverValidationErrors.password_confirmation[0];
                }

                setErrors(formattedErrors);
            }

            if (errorObj.response?.data?.message) {
                setApiError(errorObj.response.data.message);
            } else if (errorObj.message) {
                setApiError(errorObj.message);
            } else {
                setApiError('Unable to reset password. The link may have expired.');
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
                    <p>{apiError}</p>
                    {apiError.toLowerCase().includes('token') && (
                        <p className="mt-1 text-xs underline">
                            <Link to="/forgot-password">Request a new reset link</Link>
                        </p>
                    )}
                </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="password">New Password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
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

                <div className="space-y-1.5">
                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        disabled={isSubmitting}
                        aria-invalid={!!errors.password_confirmation}
                    />
                    {errors.password_confirmation && (
                        <p className="text-xs text-destructive">{errors.password_confirmation}</p>
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
                            Resetting Password...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4" />
                            Reset Password
                        </span>
                    )}
                </Button>
            </form>

            <div className="pt-2 text-center">
                <p className="text-xs text-muted-foreground">
                    Remember your password?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Return to Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPasswordForm;
