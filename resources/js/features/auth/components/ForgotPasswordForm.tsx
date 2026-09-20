import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import authService from '../services/authService';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';
import { CheckCircle2, Mail } from 'lucide-react';

export const ForgotPasswordForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const validate = (): boolean => {
        if (!email.trim()) {
            setError('Email address is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address');
            return false;
        }
        setError(null);
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.forgotPassword({ email: email.trim() });
            setIsSuccess(true);
        } catch (err) {
            const errorObj = err as AxiosError<ApiError>;
            if (errorObj.response?.data?.message) {
                setApiError(errorObj.response.data.message);
            } else if (errorObj.message) {
                setApiError(errorObj.message);
            } else {
                setApiError('Unable to send password reset link. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="w-full space-y-6 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                        Check your email for a password reset link.
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        If an account exists for <strong className="text-foreground">{email}</strong>, a password reset link has been sent. Please check your inbox or local Mailpit catcher.
                    </p>
                </div>

                <div className="pt-2">
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Return to Sign In
                    </Link>
                </div>
            </div>
        );
    }

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

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@elms.test"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError(null);
                        }}
                        disabled={isSubmitting}
                        aria-invalid={!!error}
                    />
                    {error && (
                        <p className="text-xs text-destructive">{error}</p>
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
                            Sending Reset Link...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Send Reset Link
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

export default ForgotPasswordForm;
