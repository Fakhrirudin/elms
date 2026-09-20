import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import authService from '../services/authService';
import { DepartmentSummary } from '@/types/user';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

export const RegisterForm: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [departmentId, setDepartmentId] = useState<string>('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const [departments, setDepartments] = useState<DepartmentSummary[]>([]);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        department_id?: string;
        password?: string;
        password_confirmation?: string;
    }>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchDepartments = async () => {
            try {
                const data = await authService.getDepartments();
                if (isMounted) {
                    setDepartments(data);
                }
            } catch {
                // If loading departments fails, user will see invalid department error on submit or empty dropdown
            } finally {
                if (isMounted) {
                    setIsLoadingDepartments(false);
                }
            }
        };

        void fetchDepartments();
        return () => {
            isMounted = false;
        };
    }, []);

    const validate = (): boolean => {
        const newErrors: {
            name?: string;
            email?: string;
            department_id?: string;
            password?: string;
            password_confirmation?: string;
        } = {};

        if (!name.trim()) {
            newErrors.name = 'Full name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!departmentId) {
            newErrors.department_id = 'Please select your department';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!passwordConfirmation) {
            newErrors.password_confirmation = 'Please confirm your password';
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
            if (register) {
                await register({
                    name: name.trim(),
                    email: email.trim(),
                    department_id: Number(departmentId),
                    password,
                    password_confirmation: passwordConfirmation,
                });
            } else {
                await authService.register({
                    name: name.trim(),
                    email: email.trim(),
                    department_id: Number(departmentId),
                    password,
                    password_confirmation: passwordConfirmation,
                });
            }
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const error = err as AxiosError<ApiError>;
            if (error.response?.data?.errors) {
                const serverValidationErrors = error.response.data.errors;
                const formattedErrors: {
                    name?: string;
                    email?: string;
                    department_id?: string;
                    password?: string;
                    password_confirmation?: string;
                } = {};

                if (serverValidationErrors.name?.[0]) {
                    formattedErrors.name = serverValidationErrors.name[0];
                }
                if (serverValidationErrors.email?.[0]) {
                    formattedErrors.email = serverValidationErrors.email[0];
                }
                if (serverValidationErrors.department_id?.[0]) {
                    formattedErrors.department_id = serverValidationErrors.department_id[0];
                }
                if (serverValidationErrors.password?.[0]) {
                    formattedErrors.password = serverValidationErrors.password[0];
                }
                if (serverValidationErrors.password_confirmation?.[0]) {
                    formattedErrors.password_confirmation = serverValidationErrors.password_confirmation[0];
                }

                setErrors(formattedErrors);
            }

            if (error.response?.data?.message) {
                setApiError(error.response.data.message);
            } else if (error.message) {
                setApiError(error.message);
            } else {
                setApiError('Unable to complete registration. Please try again.');
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

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Budi Pratama"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="budi@elms.test"
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
                    <Label htmlFor="department_id">Department</Label>
                    <select
                        id="department_id"
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        disabled={isSubmitting || isLoadingDepartments}
                        aria-invalid={!!errors.department_id}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">
                            {isLoadingDepartments ? 'Loading departments...' : 'Select your department...'}
                        </option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                    {errors.department_id && (
                        <p className="text-xs text-destructive">{errors.department_id}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
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
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
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
                            Creating Account...
                        </span>
                    ) : (
                        'Register as Employee'
                    )}
                </Button>
            </form>

            <div className="pt-2 text-center">
                <p className="text-xs text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
