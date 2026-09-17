import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import RoleBadge from '@/features/auth/components/RoleBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, Building, Mail, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Welcome, {user.name}!
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    ELMS Employee Learning Management System • Foundation & Authentication Active
                </p>
            </div>

            {/* Profile Overview Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Account Profile</CardTitle>
                        <RoleBadge role={user.role} />
                    </div>
                    <CardDescription>
                        Authenticated session verified via Laravel Sanctum REST API
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                            <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <span className="text-xs font-medium text-muted-foreground">Email Address</span>
                            <p className="text-sm font-semibold text-foreground">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card sm:col-span-2">
                        <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <span className="text-xs font-medium text-muted-foreground">Assigned Department</span>
                            <p className="text-sm font-semibold text-foreground">
                                {user.department ? user.department.name : 'No specific department assigned'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Roadmap Status Notice */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                        Phase 2 Foundation Ready
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        The frontend React SPA architecture is now initialized with TanStack Query, Axios interceptors, route guards, and authenticated state. Subsequent frontend tasks will implement the Course Catalog, Learning Progress, Assessment/Quiz, and Certificate issuance interfaces.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
