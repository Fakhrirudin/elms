import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Category, CourseStatus, InstructorCandidate } from '../../types';

interface CourseManagementFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    status: string;
    onStatusChange: (status: string) => void;
    categoryId: string | number;
    onCategoryChange: (categoryId: string | number) => void;
    instructorId?: string | number;
    onInstructorChange?: (instructorId: string | number) => void;
    categories: Category[];
    instructors?: InstructorCandidate[];
    showInstructorFilter?: boolean;
    onReset: () => void;
}

export const CourseManagementFilters: React.FC<CourseManagementFiltersProps> = ({
    search,
    onSearchChange,
    status,
    onStatusChange,
    categoryId,
    onCategoryChange,
    instructorId = '',
    onInstructorChange,
    categories,
    instructors = [],
    showInstructorFilter = false,
    onReset,
}) => {
    const hasActiveFilters = Boolean(search || status || categoryId || instructorId);

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        aria-label="Filter by Status"
                        value={status}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>

                {/* Category Filter */}
                <div>
                    <select
                        aria-label="Filter by Category"
                        value={categoryId}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Instructor Filter (Admins only) */}
                {showInstructorFilter && onInstructorChange && (
                    <div>
                        <select
                            aria-label="Filter by Instructor"
                            value={instructorId}
                            onChange={(e) => onInstructorChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        >
                            <option value="">All Instructors</option>
                            {instructors.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {hasActiveFilters && (
                <div className="flex justify-end pt-1">
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseManagementFilters;
