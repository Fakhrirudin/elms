import React, { useState, useEffect } from 'react';
import { Category, CourseSortOption } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';

interface CourseFilterProps {
    search: string;
    categoryId?: number | string;
    sortOption: CourseSortOption;
    categories: Category[];
    isLoadingCategories?: boolean;
    onSearchChange: (search: string) => void;
    onCategoryChange: (categoryId: number | undefined) => void;
    onSortChange: (sortOption: CourseSortOption) => void;
    onReset: () => void;
}

export const CourseFilter: React.FC<CourseFilterProps> = ({
    search,
    categoryId,
    sortOption,
    categories,
    isLoadingCategories = false,
    onSearchChange,
    onCategoryChange,
    onSortChange,
    onReset,
}) => {
    // Local state for debounced search
    const [localSearch, setLocalSearch] = useState(search);

    // Synchronize local input if search prop changes externally (e.g. onReset)
    useEffect(() => {
        setLocalSearch(search);
    }, [search]);

    // Debounce effect (350ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== search) {
                onSearchChange(localSearch);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [localSearch, search, onSearchChange]);

    const handleClearSearch = () => {
        setLocalSearch('');
        onSearchChange('');
    };

    const hasActiveFilters = Boolean(search || categoryId || sortOption !== 'newest');

    return (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Search Input with Clear Button */}
                <div className="relative md:col-span-6 lg:col-span-5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search courses by title or topic..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-9 pr-9 text-sm bg-background/50 h-10"
                        aria-label="Search courses"
                    />
                    {localSearch && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-hidden"
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Category Dropdown */}
                <div className="relative md:col-span-4 lg:col-span-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
                        <select
                            id="category-filter"
                            aria-label="Filter by category"
                            value={categoryId ? String(categoryId) : ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                onCategoryChange(val ? Number(val) : undefined);
                            }}
                            disabled={isLoadingCategories}
                            className="w-full h-10 px-3 py-2 text-sm bg-background/50 border border-input rounded-md text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring disabled:opacity-50"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sort Dropdown & Reset Button */}
                <div className="flex items-center gap-2 md:col-span-2 lg:col-span-3 justify-end">
                    <div className="flex items-center gap-1.5 w-full">
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden lg:inline" />
                        <select
                            id="sort-filter"
                            aria-label="Sort courses"
                            value={sortOption}
                            onChange={(e) => onSortChange(e.target.value as CourseSortOption)}
                            className="w-full h-10 px-3 py-2 text-sm bg-background/50 border border-input rounded-md text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                        >
                            <option value="newest">Newest First</option>
                            <option value="title_asc">Title (A - Z)</option>
                            <option value="title_desc">Title (Z - A)</option>
                            <option value="recently_published">Recently Published</option>
                        </select>
                    </div>

                    {hasActiveFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="text-xs text-muted-foreground hover:text-foreground h-10 shrink-0"
                            aria-label="Reset all filters"
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Category Filter Pills */}
            {categories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none text-xs">
                    <span className="text-muted-foreground text-xs font-medium mr-1 shrink-0">
                        Topics:
                    </span>
                    <button
                        type="button"
                        onClick={() => onCategoryChange(undefined)}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${!categoryId
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => {
                        const isSelected = categoryId === cat.id || categoryId === String(cat.id);
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => onCategoryChange(isSelected ? undefined : cat.id)}
                                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium ${isSelected
                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CourseFilter;

