import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ReportTab } from '../types';
import { BookOpen, GraduationCap, FileCheck } from 'lucide-react';

interface ReportNavTabsProps {
    activeTab: ReportTab;
}

export const ReportNavTabs: React.FC<ReportNavTabsProps> = ({ activeTab }) => {
    const { user } = useAuth();
    const isEmployee = user?.role === 'EMPLOYEE';

    const allTabs: { id: ReportTab; label: string; href: string; icon: React.FC<{ className?: string }> }[] = [
        { id: 'courses', label: 'Course Performance', href: '/reports/courses', icon: BookOpen },
        { id: 'learning', label: isEmployee ? 'My Learning Progress' : 'Learning Progress', href: '/reports/learning', icon: GraduationCap },
        { id: 'quiz', label: 'Quiz Assessments', href: '/reports/quiz', icon: FileCheck },
    ];

    // Employees can only access the learning report
    const visibleTabs = isEmployee
        ? allTabs.filter((tab) => tab.id === 'learning')
        : allTabs;

    return (
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border/80 rounded-lg w-fit" data-testid="report-nav-tabs">
            {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <Link
                        key={tab.id}
                        to={tab.href}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-card text-foreground shadow-xs font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                        }`}
                        data-testid={`report-tab-${tab.id}`}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
};

export default ReportNavTabs;
