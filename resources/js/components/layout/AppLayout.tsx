import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import RoleBadge from '@/features/auth/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, BookOpen } from 'lucide-react';

export const AppLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col text-foreground">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand & Navigation */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-foreground hover:opacity-90">
                            <span className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-xs">
                                E
                            </span>
                            <span className="hidden sm:inline tracking-tight font-semibold">
                                ELMS
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Main Navigation">
                            <Link
                                to="/dashboard"
                                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    location.pathname === '/dashboard'
                                        ? 'bg-muted text-foreground font-semibold'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/courses"
                                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    location.pathname.startsWith('/courses')
                                        ? 'bg-muted text-foreground font-semibold'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            >
                                Courses
                            </Link>
                            {(user?.role === 'SUPER_ADMIN' ||
                                user?.role === 'LEARNING_ADMIN' ||
                                user?.role === 'INSTRUCTOR') && (
                                <Link
                                    to="/admin/courses"
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                        location.pathname.startsWith('/admin/courses')
                                            ? 'bg-muted text-foreground font-semibold'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    Manage Courses
                                </Link>
                            )}
                            {user?.role === 'EMPLOYEE' && (
                                <>
                                    <Link
                                        to="/my-learning"
                                        className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                            location.pathname.startsWith('/my-learning')
                                                ? 'bg-muted text-foreground font-semibold'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        My Learning
                                    </Link>
                                    <Link
                                        to="/certificates"
                                        className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                            location.pathname.startsWith('/certificates')
                                                ? 'bg-muted text-foreground font-semibold'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        Certificates
                                    </Link>
                                </>
                            )}
                            <Link
                                to="/reports"
                                className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    location.pathname.startsWith('/reports')
                                        ? 'bg-muted text-foreground font-semibold'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                            >
                                Reports
                            </Link>
                        </nav>
                    </div>

                    {/* Authenticated User Menu & Logout */}
                    {user && (
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex flex-col items-end text-right hidden sm:flex">
                                <span className="text-sm font-semibold text-foreground leading-tight">
                                    {user.name}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <RoleBadge role={user.role} />
                                    {user.department && (
                                        <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                            • {user.department.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">Sign Out</span>
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
                ELMS — Employee Learning Management System • React SPA + Laravel Modular Monolith
            </footer>
        </div>
    );
};

export default AppLayout;
